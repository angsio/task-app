// (call: toolCall) -> string
// Scalar arguments only. Enough to show what a call did without this file
// knowing any tool's schema.
const describeCall = (call) => {
    const args = Object.entries(JSON.parse(call.function.arguments || '{}'))
        .filter(([, value]) => typeof value !== 'object')
        .map(([field, value]) => `${field}: ${value}`)

    return args.length ? `Used ${call.function.name} (${args.join(', ')})` : `Used ${call.function.name}`
}

/*
  Flatten the raw transcript into what the panel renders.

  In:  messages  message[] straight from the server
  Out: bubble[], each { key: string, kind: 'user' | 'agent' | 'tool', text: string }

  A tool call only appears once it has a result, so an action still awaiting
  approval is not described twice; the confirm box is already showing it.
*/
export const toBubbles = (messages) => {
    const answered = new Set(messages.map(message => message.tool_call_id).filter(Boolean))
    const bubbles = []

    messages.forEach((message, index) => {
        if (message.role === 'user') {
            bubbles.push({ key: `${index}`, kind: 'user', text: message.content })
            return
        }

        if (message.role !== 'assistant') return

        if (message.content) bubbles.push({ key: `${index}-text`, kind: 'agent', text: message.content })

        message.tool_calls
            ?.filter(call => answered.has(call.id))
            .forEach((call, order) => bubbles.push({ key: `${index}-${order}`, kind: 'tool', text: describeCall(call) }))
    })

    return bubbles
}
