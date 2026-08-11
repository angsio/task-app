import { chat } from './useBedrock.js'
import { runOnce } from './ledger.js'
import { TOOLS, ENTRY_TOOL, toModelSpec, inRunOrder } from './tools/index.js'
import { resolveTimeZone, formatInZone, utcOffsetIn } from './tools/utilities.js'
import { emit, newRunId, hashOwner, causeOf, bytesOf, modelMetrics, estimateTokens, embedCostOf, grounding, LOG_CONTENT } from '../metrics/index.js'

const MAX_STEPS = 8

// (timeZone) -> string, the instructions sent at the top of every turn.
const systemPrompt = (timeZone) => {
    const now = new Date()
    const offset = utcOffsetIn(now, timeZone)

    return `You manage a user's schedule of tasks, events and reminders. Never use emojis.

Right now it is ${formatInZone(now, timeZone)}, in the user's timezone (${timeZone}). Resolve "today", "tomorrow", "tonight" and "next week" against that.

You cannot see the schedule and you remember nothing about it between messages. Call find_tools to obtain a tool, then call that tool. You may call find_tools as many times as you need, search again whenever the next step needs a capability you do not hold yet.

GATHER BEFORE YOU ACT. If the request mentions anything already on the schedule, "after my meeting", "the same day as X", "when am I free", list the relevant items and read their real times BEFORE you create or change anything. Never guess a time, a title or a theme, and never state that something is on the schedule unless a tool told you so.

THEMES COME FIRST. Every task, event and reminder lives in a theme, and that theme has to already exist before an item can be created in it or moved into it. Never assume a theme exists because the user named it: list the themes and look. If the one you need is not there, create the theme, wait for it to come back, and only then create the items. Creating a theme and the items that go in it are two separate turns, never one.

TIMES. Every time a tool reports is already in the user's own timezone and reads like "Jul 30, 2026, 5:00 PM EDT". SAY times back in that same style, always naming the zone, for example "8:00 PM EDT". Never answer with a UTC time, an ISO string or a bare number of hours.
When you WRITE a time into a tool, use ISO carrying this offset: 2 pm for this user is 2026-07-30T14:00:00${offset}. Never write a time ending in Z.

If the user is only chatting, just reply, do not call find_tools. Always finish answering everything the user asked, even after using a tool.`
}

const DECLINED_REPLY = {
    cancelled: true,
    message: 'The user declined this action. Nothing was created or changed. Tell the user it was cancelled and do not claim it was done.',
}

const ABANDONED_REPLY = {
    error: 'An earlier action in this same confirmation failed, so this one was not run. Nothing was created or changed by it. Tell the user which part failed and what is still missing, and do not claim this one was done.',
}

const STEP_LIMIT_REPLY = `I stopped after ${MAX_STEPS} steps without finishing that. Try asking for one thing at a time.`

// (call) -> boolean, true if the user must approve this call before it runs.
const needsApproval = (call) => TOOLS[call.function.name]?.confirm === true

// (messages) -> toolCall[], the gated calls the user is being asked about.
// They sit on the last assistant message, which is not always the last message:
// non-gated calls in the same reply append their results after it.
const awaitingApproval = (messages) => {
    const last = messages.findLast(message => message.role === 'assistant')

    return (last?.tool_calls ?? []).filter(needsApproval)
}

/*
  (name, args, outcome) -> the retrieval fields on a tool.call event.

  Only find_tools has any: what it matched, and the size of the string it sent
  to the embedding model. The match fields are left off when the search threw.
*/
const retrievalFields = (name, args, outcome) => {
    if (name !== ENTRY_TOOL) return {}

    const embedTokens = estimateTokens(args?.need ?? '')
    if (!outcome) return { embedTokens }

    const found = outcome.reply?.found ?? []

    return { embedTokens, retrieved: found.map(match => match.name), retrievedCount: found.length }
}

/*
  (call, turn, step) -> Promise<{ reply, documents?, removed?, offer? }>, runs
  one tool call.

  Anything gated, plus anything marked `once`, goes through the ledger, so a
  resent call runs only the first time.
*/
const runToolCall = async (call, turn, step) => {
    const name = call.function.name
    const tool = TOOLS[name]
    const started = Date.now()

    const record = (args, outcome, error) => {
        const ms = Date.now() - started
        const retrieval = retrievalFields(name, args, outcome)

        turn.toolMs += ms
        turn.called.push(name)
        turn.embedTokens += retrieval.embedTokens ?? 0

        emit('tool.call', {
            ...turn.trace,
            step,
            tool: name,
            ms,
            ok: !error,
            error: error ?? null,
            gated: tool?.confirm === true,
            replyBytes: bytesOf(outcome?.reply),
            ...retrieval,
            ...(LOG_CONTENT ? { arguments: call.function.arguments } : {}),
        })
    }

    if (!tool) {
        const outcome = { reply: { error: `Unknown tool: ${name}` } }
        record(null, outcome, 'unknown_tool')

        return outcome
    }

    let args
    try {
        args = JSON.parse(call.function.arguments)
    } catch (error) {
        record(null, null, causeOf(error))

        throw error
    }

    try {
        const outcome = (!tool.confirm && !tool.once)
            ? await tool.run(args, turn.context)
            : await runOnce(call, turn.context.owner, () => tool.run(args, turn.context))

        record(args, outcome, outcome?.reply?.error ? 'tool_reported_error' : null)

        return outcome
    } catch (error) {
        record(args, null, causeOf(error))

        throw error
    }
}

/*
  (turn, step) -> Promise<message>, one model round trip.

  A failed call is recorded and rethrown unchanged, so its latency still counts
  and an unreachable model is still a 502 to the browser.
*/
const callModel = async (turn, step) => {
    const specs = [...turn.offered].map(name => toModelSpec(TOOLS[name]))
    const started = Date.now()

    try {
        const { message, usage, model } = await chat(turn.messages, specs)
        const ms = Date.now() - started
        const metrics = modelMetrics(usage, turn.messages, message, model)

        turn.modelMs += ms
        turn.tokensIn += metrics.tokensIn
        turn.tokensOut += metrics.tokensOut
        if (metrics.tokenSource === 'estimated') turn.estimated = true
        if (metrics.costUsd === null) turn.priced = false
        else turn.costUsd += metrics.costUsd

        emit('model.call', {
            ...turn.trace,
            step,
            ms,
            toolsOffered: specs.length,
            toolCalls: (message.tool_calls ?? []).length,
            finish: message.tool_calls?.length ? 'tools' : 'text',
            ok: true,
            error: null,
            ...metrics,
        })

        return message
    } catch (error) {
        const ms = Date.now() - started
        turn.modelMs += ms

        emit('model.call', {
            ...turn.trace,
            step,
            ms,
            toolsOffered: specs.length,
            toolCalls: 0,
            finish: null,
            ok: false,
            error: causeOf(error),
        })

        throw error
    }
}

/*
  (turn) -> the fields shared by every turn.end event, however the turn ended.

  The chat and embedding models are counted apart and never summed.
*/
const summarise = (turn) => ({
    ...turn.trace,
    ms: Date.now() - turn.startedAt,
    steps: turn.steps,
    modelMs: turn.modelMs,
    toolMs: turn.toolMs,
    tools: turn.called,
    path: turn.called.join(' > ') || 'none',
    chatTokensIn: turn.tokensIn,
    chatTokensOut: turn.tokensOut,
    chatTokenSource: turn.estimated ? 'estimated' : 'reported',
    chatCostUsd: turn.priced ? Math.round(turn.costUsd * 1e6) / 1e6 : null,
    embedTokens: turn.embedTokens,
    embedCostUsd: embedCostOf(turn.embedTokens),
})

/*
  (turn, pending: toolCall[], outcome?) -> the body sent back to the browser.

  The only exit that does not throw, so turn.end is emitted here rather than at
  each return. Each pending call becomes { id, name, lines }, the lines coming
  from that tool's summarise.
*/
const toResponse = (turn, pending, outcome) => {
    if (pending.length) {
        emit('confirmation', {
            ...turn.trace,
            phase: 'issued',
            tools: pending.map(call => call.function.name),
            count: pending.length,
        })
    }

    emit('turn.end', {
        ...summarise(turn),
        outcome: outcome ?? (pending.length ? 'awaiting_confirmation' : 'completed'),
        error: null,
        ...grounding(turn),
    })

    return {
        messages: turn.messages,
        documents: turn.documents,
        removed: turn.removed,
        pending: pending.map(call => ({
            id: call.id,
            name: call.function.name,
            lines: TOOLS[call.function.name]?.summarise?.(JSON.parse(call.function.arguments), { timeZone: turn.timeZone }) ?? [],
        })),
    }
}

/*
  (turn, call, outcome) -> void, writes one tool's outcome into the turn:

    reply      appended to turn.messages as this call's tool result
    documents  appended to turn.documents
    removed    appended to turn.removed
    offer      added to turn.offered, making those tools callable
*/
const applyOutcome = (turn, call, { reply, documents = [], removed = [], offer = [] }) => {
    turn.messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(reply) })
    turn.documents.push(...documents)
    turn.removed.push(...removed)
    offer.filter(name => TOOLS[name]).forEach(name => turn.offered.add(name))
}

/*
  (turn, calls, step, stopOnError) -> Promise<void>, runs a batch of calls.

  They execute in the order the schema requires, then their results are recorded
  in the order the model asked for, so the transcript still lines up with its own
  reply. stopOnError abandons the rest after the first failure, which is what a
  batch the user approved as one set needs.
*/
const runBatch = async (turn, calls, step, stopOnError = false) => {
    const outcomes = new Map()
    let failed = false

    for (const call of inRunOrder(calls)) {
        if (failed) {
            outcomes.set(call.id, { reply: ABANDONED_REPLY })
            continue
        }

        const outcome = await runToolCall(call, turn, step)
        outcomes.set(call.id, outcome)

        if (stopOnError) failed = Boolean(outcome.reply?.error)
    }

    for (const call of calls) applyOutcome(turn, call, outcomes.get(call.id))
}

/*
  Run one turn of the conversation.

  In:  messages   message[], the whole transcript. The server keeps no session,
                  so this is the entire state and it round-trips
       approved   boolean, present ONLY when answering a pending confirmation
       owner      string, the signed-in user's id; scopes every tool
       timeZone   string, the browser's IANA zone; how every time is phrased

  Out: { messages, pending, documents, removed }
       messages   message[], the transcript to send back next turn
       pending    action[], each { id, name, lines } awaiting a yes/no
       documents  doc[], items and themes written this turn, for the browser's cache
       removed    doc[], items and themes deleted this turn, for the same cache
*/
export const runAgent = async ({ messages, approved, owner, timeZone }) => {

    const zone = resolveTimeZone(timeZone)
    const turn = {
        messages: [
            { role: 'system', content: systemPrompt(zone) },
            ...messages.filter(message => message.role !== 'system'),
        ],
        timeZone: zone,
        context: { owner, timeZone: zone },
        offered: new Set([ENTRY_TOOL]),
        documents: [],
        removed: [],

        // Everything below this line exists only to be measured.
        trace: { runId: newRunId(), ownerHash: hashOwner(owner) },
        startedAt: Date.now(),
        steps: 0,
        modelMs: 0,
        toolMs: 0,
        called: [],
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        embedTokens: 0,
        estimated: false,
        priced: true,
    }

    // Before any work, so a turn that dies with the process still left a record.
    emit('turn.start', {
        ...turn.trace,
        messages: messages.length,
        resuming: approved !== undefined,
        timeZone: zone,
    })

    try {
        // Answering a confirmation. `false` is an answer too, so this tests for
        // the field being present rather than for it being true.
        if (approved !== undefined) {
            const pending = awaitingApproval(turn.messages)

            // The other half of the confirmation, arriving in its own request.
            if (pending.length) {
                emit('confirmation', {
                    ...turn.trace,
                    phase: approved ? 'approved' : 'declined',
                    tools: pending.map(call => call.function.name),
                    count: pending.length,
                })
            }

            // Approved as one set, so the first failure stops the rest rather
            // than leaving half of them applied.
            if (approved) await runBatch(turn, pending, -1, true)
            else pending.forEach(call => applyOutcome(turn, call, { reply: DECLINED_REPLY }))
        }

        for (let step = 0; step < MAX_STEPS; step++) {
            turn.steps = step + 1

            const reply = await callModel(turn, step)
            turn.messages.push(reply)

            const calls = reply.tool_calls ?? []
            if (!calls.length) return toResponse(turn, [])

            await runBatch(turn, calls.filter(call => !needsApproval(call)), step)

            const gated = calls.filter(needsApproval)
            if (gated.length) return toResponse(turn, gated)
        }

        turn.messages.push({ role: 'assistant', content: STEP_LIMIT_REPLY })

        return toResponse(turn, [], 'step_limit')
    } catch (error) {
        // A partial turn is recorded, not discarded, and rethrown untouched so
        // errors.js still decides the status code.
        emit('turn.end', { ...summarise(turn), outcome: 'error', error: causeOf(error) })

        throw error
    }
}
