import { chat } from './useBedrock.js'
import { TOOLS, ENTRY_TOOL, toSpec } from './tools/index.js'

const MAX_STEPS = 8

// (date: Date) -> string, e.g. '-04:00'. The server runs in the user's
// timezone, so this is their offset.
const utcOffset = (date) => {
    const minutes = -date.getTimezoneOffset()
    const size = Math.abs(minutes)

    return `${minutes < 0 ? '-' : '+'}${String(Math.floor(size / 60)).padStart(2, '0')}:${String(size % 60).padStart(2, '0')}`
}

// () -> string. Rebuilt every turn so "now" is never stale.
const systemPrompt = () => {
    const now = new Date()
    const offset = utcOffset(now)
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

    return `You manage a user's schedule of tasks, events and reminders. Never use emojis.

Right now it is ${now.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })} in ${zone} (UTC${offset}). Resolve "today", "tomorrow", "tonight" and "next week" against that.

You cannot see the schedule and you remember nothing about it between messages. Call find_tools to obtain a tool, then call that tool. You may call find_tools as many times as you need, search again whenever the next step needs a capability you do not hold yet.

GATHER BEFORE YOU ACT. If the request mentions anything already on the schedule, "after my meeting", "the same day as X", "when am I free", list the relevant items and read their real times BEFORE you create or change anything. Never guess a time, a title or a theme, and never state that something is on the schedule unless a tool told you so.

TIMES. Tools report UTC, ending in Z. The user speaks in local wall-clock time, so write times with the local offset: 2 pm local is 2026-07-30T14:00:00${offset}. Never write a bare Z time for something the user described in words, and never copy a Z time from a tool into a time the user gave you.

If the user is only chatting, just reply, do not call find_tools. Always finish answering everything the user asked, even after using a tool.`
}

const DECLINED = {
    cancelled: true,
    message: 'The user declined this action. Nothing was created or changed. Tell the user it was cancelled and do not claim it was done.',
}

const STEP_LIMIT = `I stopped after ${MAX_STEPS} steps without finishing that. Try asking for one thing at a time.`

// (messages: message[]) -> message[] with exactly one, current system message.
// Replaced rather than preserved: the transcript round-trips through the client,
// so a kept system message would pin "now" to whenever the chat started.
const withSystem = (messages) => [
    { role: 'system', content: systemPrompt() },
    ...messages.filter(message => message.role !== 'system'),
]

// (call: toolCall) -> boolean, whether the user must approve it first
const needsApproval = (call) => TOOLS[call.function.name]?.confirm === true

// (turn) -> spec[], the tool definitions the model may currently call
const specs = (turn) => [...turn.offered].map(name => toSpec(TOOLS[name]))

// (messages: message[]) -> toolCall[]
// Calls on the last assistant message that never got a tool response, exactly
// what the client was asked to approve.
const awaitingApproval = (messages) => {
    const last = messages.findLast(message => message.role === 'assistant')
    const answered = new Set(messages.map(message => message.tool_call_id).filter(Boolean))

    return (last?.tool_calls ?? []).filter(call => needsApproval(call) && !answered.has(call.id))
}

// (call: toolCall, owner: string) -> Promise<{ reply, documents?, offer? }>
// Every tool is handed the owner so it can only ever touch that user's data.
const invoke = async (call, owner) => {
    const tool = TOOLS[call.function.name]
    if (!tool) return { reply: { error: `Unknown tool: ${call.function.name}` } }

    return tool.run(JSON.parse(call.function.arguments), { owner })
}

// (turn, call: toolCall, outcome: { reply, documents?, offer? }) -> void, mutates turn
// The model reads `reply`, the client gets `documents`, and `offer` widens what
// the model may call from here on.
const absorb = (turn, call, { reply, documents = [], offer = [] }) => {
    turn.messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(reply) })
    turn.documents.push(...documents)
    offer.filter(name => TOOLS[name]).forEach(name => turn.offered.add(name))
}

// (call: toolCall) -> { id, name, lines: string[] }
// Described in text so the client needs no knowledge of the tool's arguments.
const describe = (call) => {
    const args = JSON.parse(call.function.arguments)

    return {
        id: call.id,
        name: call.function.name,
        lines: TOOLS[call.function.name]?.summarise?.(args) ?? [],
    }
}

// (turn, pending: toolCall[]) -> the turn's reply body for the client
const result = (turn, pending) => ({
    messages: turn.messages,
    documents: turn.documents,
    pending: pending.map(describe),
})

/*
  Run one turn of the conversation.

  In:  messages   message[], the whole transcript so far. The server keeps no
                  session, so this is the entire state and it round-trips.
       approved   boolean, ONLY when answering a pending confirmation
       owner      string, the signed-in user's id; scopes every tool

  Out: { messages, pending, documents }
       messages   message[], the transcript to send back next turn
       pending    action[], each { id, name, lines: string[] } awaiting a yes/no
       documents  doc[], items written this turn, for the client's cache

  The model starts holding one tool, find_tools, so it either answers in words
  or asks for a capability. Whatever it finds is offered for the rest of the
  turn, and it may search again at any step.
*/
export const runAgent = async ({ messages, approved, owner }) => {
    const turn = {
        messages: withSystem(messages),
        offered: new Set([ENTRY_TOOL]),
        documents: [],
    }

    if (approved !== undefined) {
        for (const call of awaitingApproval(turn.messages)) {
            absorb(turn, call, approved ? await invoke(call, owner) : { reply: DECLINED })
        }
    }

    for (let step = 0; step < MAX_STEPS; step++) {
        const reply = await chat(turn.messages, specs(turn))
        turn.messages.push(reply)

        const calls = reply.tool_calls ?? []
        if (!calls.length) return result(turn, [])

        for (const call of calls.filter(call => !needsApproval(call))) {
            absorb(turn, call, await invoke(call, owner))
        }

        const held = calls.filter(needsApproval)
        if (held.length) return result(turn, held)
    }

    turn.messages.push({ role: 'assistant', content: STEP_LIMIT })
    return result(turn, [])
}
