import { useState } from 'react'

import { sendMessages, resolveActions } from '../../../api'
import { useMutation } from '../../../hooks'
import { List } from '../../../components'

const describeToolCall = (call) => {
    const args = Object.entries(JSON.parse(call.function.arguments || '{}'))
        .filter(([, value]) => typeof value !== 'object')
        .map(([field, value]) => `${field}: ${value}`)

    return args.length ? `Used ${call.function.name} (${args.join(', ')})` : `Used ${call.function.name}`
}

const toBubbles = (messages) => {
    const bubbles = []

    messages.forEach((message, index) => {
        if (message.role === 'user') {
            bubbles.push({ key: `${index}`, kind: 'user', text: message.content })
        } else if (message.role === 'assistant') {
            if (message.content) bubbles.push({ key: `${index}-text`, kind: 'assistant', text: message.content })

            message.tool_calls
                ?.filter(call => messages.some(entry => entry.tool_call_id === call.id))
                .forEach((call, order) => bubbles.push({ key: `${index}-${order}`, kind: 'tool', text: describeToolCall(call) }))
        }
    })

    return bubbles
}

const pendingItems = (pending) => pending.flatMap(call => call.arguments.items ?? [])

const styles = {
    panel:        'bg-slate-300 border-b border-black',
    hint:         'text-sm text-slate-500',
    toolText:     'text-xs italic text-slate-500',
    bubble:       'text-sm whitespace-pre-wrap',
    userBg:       'bg-slate-100',
    botBg:        'bg-white',
    confirmBox:   'bg-white border border-black',
    confirmTitle: 'text-sm font-bold',
    itemList:     'text-sm list-disc',
    form:         'border-t border-black',
    input:        'text-sm bg-slate-100 outline-none',
    primaryBtn:   'text-sm text-white bg-slate-700 disabled:opacity-50',
    cancelBtn:    'text-sm bg-slate-200 disabled:opacity-50',
}

export const Agent = () => {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState([])
    const [pending, setPending] = useState([])

    const { mutate: sendMutation, loading: sending } = useMutation(sendMessages)
    const { mutate: resolveMutation, loading: resolving } = useMutation(resolveActions)

    const busy = sending || resolving
    const bubbles = toBubbles(messages)

    const send = async (event) => {
        event.preventDefault()
        if (!input.trim() || busy) return

        const next = [...messages, { role: 'user', content: input }]
        setMessages(next)
        setInput('')
        setPending([])

        const result = await sendMutation(next)
        if (!result) return

        setMessages(result.messages)
        setPending(result.pending)
    }

    const resolve = async (approved) => {
        const result = await resolveMutation(messages, approved)
        if (!result) return

        setMessages(result.messages)
        setPending(result.pending)
    }

    return (
        <div className={`h-3/5 w-full flex flex-col ${styles.panel}`}>
            <div className="h-full w-full overflow-y-auto py-2">
                {bubbles.length === 0 && !busy && (
                    <p className={`px-3 ${styles.hint}`}>Ask the agent something.</p>
                )}
                <List
                    items={bubbles}
                    keyExtractor={bubble => bubble.key}
                    flow="x"
                    slots={1}
                    autoSize="auto"
                    className="w-full"
                    itemClassName="px-3 py-1"
                >
                    {bubble => {
                        if (bubble.kind === 'tool') return (
                            <div className="w-full flex justify-start">
                                <span className={`max-w-4/5 px-2 ${styles.toolText}`}>{bubble.text}</span>
                            </div>
                        )

                        return (
                            <div className={`w-full flex ${bubble.kind === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <span className={`max-w-4/5 p-2 ${styles.bubble} ${bubble.kind === 'user' ? styles.userBg : styles.botBg}`}>
                                    {bubble.text}
                                </span>
                            </div>
                        )
                    }}
                </List>

                {pending.length > 0 && (
                    <div className="w-full flex justify-center px-3 py-1">
                        <div className={`max-w-4/5 w-full flex flex-col gap-2 p-3 ${styles.confirmBox}`}>
                            <p className={styles.confirmTitle}>Create these items?</p>
                            <ul className={`pl-4 ${styles.itemList}`}>
                                {pendingItems(pending).map((item, index) => (
                                    <li key={index}>{item.title} — {item.itemType} in {item.theme}</li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => resolve(true)} disabled={resolving} className={`px-3 py-1 ${styles.primaryBtn}`}>Confirm</button>
                                <button type="button" onClick={() => resolve(false)} disabled={resolving} className={`px-3 py-1 ${styles.cancelBtn}`}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {busy && <p className={`px-3 py-1 ${styles.hint}`}>Thinking...</p>}
            </div>
            <form onSubmit={send} className={`w-full flex ${styles.form}`}>
                <input
                    type="text"
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    disabled={busy}
                    placeholder="Send a prompt..."
                    className={`w-full p-2 ${styles.input}`}
                />
                <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className={`px-4 ${styles.primaryBtn}`}
                >
                    Send
                </button>
            </form>
        </div>
    )
}
