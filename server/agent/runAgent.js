import { chat } from './useBedrock.js'
import { runOnce } from './ledger.js'
import { TOOLS, ENTRY_TOOL, toModelSpec } from './tools/index.js'
import { resolveTimeZone, formatInZone, utcOffsetIn } from './tools/utilities.js'

const MAX_STEPS = 8

// (timeZone) -> string, the instructions sent at the top of every turn.
const systemPrompt = (timeZone) => {
    const now = new Date()
    const offset = utcOffsetIn(now, timeZone)

    return `You manage a user's schedule of tasks, events and reminders. Never use emojis.

Right now it is ${formatInZone(now, timeZone)}, in the user's timezone (${timeZone}). Resolve "today", "tomorrow", "tonight" and "next week" against that.

You cannot see the schedule and you remember nothing about it between messages. Call find_tools to obtain a tool, then call that tool. You may call find_tools as many times as you need, search again whenever the next step needs a capability you do not hold yet.

GATHER BEFORE YOU ACT. If the request mentions anything already on the schedule, "after my meeting", "the same day as X", "when am I free", list the relevant items and read their real times BEFORE you create or change anything. Never guess a time, a title or a theme, and never state that something is on the schedule unless a tool told you so.

TIMES. Every time a tool reports is already in the user's own timezone and reads like "Jul 30, 2026, 5:00 PM EDT". SAY times back in that same style, always naming the zone, for example "8:00 PM EDT". Never answer with a UTC time, an ISO string or a bare number of hours.
When you WRITE a time into a tool, use ISO carrying this offset: 2 pm for this user is 2026-07-30T14:00:00${offset}. Never write a time ending in Z.

If the user is only chatting, just reply, do not call find_tools. Always finish answering everything the user asked, even after using a tool.`
}

const DECLINED_REPLY = {
    cancelled: true,
    message: 'The user declined this action. Nothing was created or changed. Tell the user it was cancelled and do not claim it was done.',
}

const STEP_LIMIT_REPLY = `I stopped after ${MAX_STEPS} steps without finishing that. Try asking for one thing at a time.`

// (call) -> boolean, true if the user must approve this call before it runs.
const needsApproval = (call) => TOOLS[call.function.name]?.confirm === true

/*
  (messages) -> toolCall[], the gated calls the user is being asked about.

  Only the last assistant message can hold any, because the loop returns as soon
  as it produces one. It is not always the last message though: non-gated calls
  in the same reply run first and append their results after it.
*/
const awaitingApproval = (messages) => {
    const last = messages.findLast(message => message.role === 'assistant')

    return (last?.tool_calls ?? []).filter(needsApproval)
}

// (call, context) -> Promise<{ reply, documents?, offer? }>, runs one tool call.
// Anything gated, plus anything marked `once`, goes through the ledger so a
// resent call runs only the first time.
const runToolCall = async (call, context) => {
    const tool = TOOLS[call.function.name]
    if (!tool) return { reply: { error: `Unknown tool: ${call.function.name}` } }

    const args = JSON.parse(call.function.arguments)
    if (!tool.confirm && !tool.once) return tool.run(args, context)

    return runOnce(call, context.owner, () => tool.run(args, context))
}

/*
  (turn, call, outcome) -> void, writes one tool's outcome into the turn:

    reply      appended to turn.messages as this call's tool result
    documents  appended to turn.documents
    offer      added to turn.offered, making those tools callable
*/
const applyOutcome = (turn, call, { reply, documents = [], offer = [] }) => {
    turn.messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(reply) })
    turn.documents.push(...documents)
    offer.filter(name => TOOLS[name]).forEach(name => turn.offered.add(name))
}

// (turn, pending: toolCall[]) -> the body sent back to the browser. Each pending
// call becomes { id, name, lines }, the lines coming from that tool's summarise.
const toResponse = (turn, pending) => ({
    messages: turn.messages,
    documents: turn.documents,
    pending: pending.map(call => ({
        id: call.id,
        name: call.function.name,
        lines: TOOLS[call.function.name]?.summarise?.(JSON.parse(call.function.arguments), { timeZone: turn.timeZone }) ?? [],
    })),
})

/*
  Run one turn of the conversation.

  In:  messages   message[], the whole transcript. The server keeps no session,
                  so this is the entire state and it round-trips
       approved   boolean, present ONLY when answering a pending confirmation
       owner      string, the signed-in user's id; scopes every tool
       timeZone   string, the browser's IANA zone; how every time is phrased

  Out: { messages, pending, documents }
       messages   message[], the transcript to send back next turn
       pending    action[], each { id, name, lines } awaiting a yes/no
       documents  doc[], items written this turn, for the browser's cache
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
    }

    // Answering a confirmation. `false` is an answer too, so this tests for the
    // field being present rather than for it being true.
    if (approved !== undefined) {
        for (const call of awaitingApproval(turn.messages)) {
            applyOutcome(turn, call, approved ? await runToolCall(call, turn.context) : { reply: DECLINED_REPLY })
        }
    }

    for (let step = 0; step < MAX_STEPS; step++) {
        const reply = await chat(turn.messages, [...turn.offered].map(name => toModelSpec(TOOLS[name])))
        turn.messages.push(reply)

        const calls = reply.tool_calls ?? []
        if (!calls.length) return toResponse(turn, [])

        for (const call of calls.filter(call => !needsApproval(call))) {
            applyOutcome(turn, call, await runToolCall(call, turn.context))
        }

        const gated = calls.filter(needsApproval)
        if (gated.length) return toResponse(turn, gated)
    }

    turn.messages.push({ role: 'assistant', content: STEP_LIMIT_REPLY })
    return toResponse(turn, [])
}
