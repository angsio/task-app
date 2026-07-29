import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'

import { sendMessages, resolveActions } from '../../../api'
import { useMutation } from '../../../hooks'
import { List } from '../../../components'
import { useScheduleContext } from '../ScheduleContext'

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
    panel:        'bg-obsidian border-b border-border',
    hint:         'text-sm text-ash',
    toolText:     'text-xs italic text-ash',
    bubble:       'text-sm whitespace-pre-wrap rounded-md',
    userBg:       'border border-accent/20 bg-accent/10 text-parchment',
    botBg:        'border border-border bg-crypt text-parchment',
    confirmBox:   'border border-border bg-crypt rounded-md',
    confirmTitle: 'font-display text-sm text-parchment',
    itemList:     'text-sm text-parchment-dim list-disc',
    form:         'border-t border-border',
    input:        'text-sm text-parchment bg-void outline-none',
    primaryBtn:   'rounded-md border border-accent/50 bg-accent/10 text-sm font-display text-accent-bright transition-colors hover:bg-accent/20 disabled:opacity-50',
    cancelBtn:    'rounded-md border border-border text-sm font-display text-parchment-dim transition-colors hover:text-parchment disabled:opacity-50',
}

export const Agent = () => {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState([])
    const [pending, setPending] = useState([])

    const { mutate: sendMutation, loading: sending } = useMutation(sendMessages)
    const { mutate: resolveMutation, loading: resolving } = useMutation(resolveActions)

    const { upsertItem } = useScheduleContext()

    const busy = sending || resolving
    const bubbles = toBubbles(messages)

    const applyTurn = (result) => {
        setMessages(result.messages)
        setPending(result.pending)
        result.documents.forEach(upsertItem)
    }

    const send = async (event) => {
        event.preventDefault()
        if (!input.trim() || busy) return

        const next = [...messages, { role: 'user', content: input }]
        setMessages(next)
        setInput('')
        setPending([])

        const result = await sendMutation(next)
        if (!result) return

        applyTurn(result)
    }

    const resolve = async (approved) => {
        const result = await resolveMutation(messages, approved)
        if (!result) return

        applyTurn(result)
    }

    const sendOnEnter = (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return

        send(event)
    }

    return (
        <div className={`h-3/5 w-full flex flex-col ${styles.panel}`}>
            <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-none py-2">
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
            <form onSubmit={send} className={`w-full flex shrink-0 ${styles.form}`}>
                <textarea
                    rows={1}
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    onKeyDown={sendOnEnter}
                    disabled={busy}
                    placeholder="Send a prompt..."
                    className={`w-full max-h-24 field-sizing-content resize-none p-2 overflow-y-auto ${styles.input}`}
                />
                <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    title="Send"
                    aria-label="Send"
                    className={`px-4 ${styles.primaryBtn}`}
                >
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </form>
        </div>
    )
}