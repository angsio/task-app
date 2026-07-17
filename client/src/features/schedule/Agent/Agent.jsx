import { useState } from 'react'

import { sendPrompt, executeActions } from '../../../api'
import { useMutation } from '../../../hooks'
import { List } from '../../../components'

const describeToolCall = (call) => {
    const args = Object.entries(call.arguments ?? {})
    if (args.length === 0) return `Called ${call.name}`

    const fields = args.map(([field, value]) => `${field}: ${value}`).join(', ')
    return `Called ${call.name} with ${fields}`
}

const pendingItems = (actions) => actions.flatMap(action => action.arguments.items ?? [])

export const Agent = () => {

    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState([])

    const { mutate: sendPromptMutation, loading } = useMutation(sendPrompt)
    const { mutate: executeActionsMutation, loading: executing } = useMutation(executeActions)

    const appendMessage = (role, text) => {
        setMessages(current => [...current, { id: crypto.randomUUID(), role, text }])
    }

    const updateMessage = (id, changes) => {
        setMessages(current => current.map(message => message.id === id ? { ...message, ...changes } : message))
    }

    const runSendPrompt = async (event) => {
        event.preventDefault()
        if (!prompt.trim() || loading) return

        const text = prompt
        appendMessage('user', text)
        setPrompt('')

        const result = await sendPromptMutation(text)
        if (!result) return

        result.toolCalls.forEach(call => appendMessage('tool', describeToolCall(call)))

        if (result.pendingActions.length) {
            setMessages(current => [...current, { id: crypto.randomUUID(), role: 'confirmation', actions: result.pendingActions, status: 'pending' }])
        } else {
            appendMessage('assistant', result.reply)
        }
    }

    const confirmActions = async (message) => {
        const result = await executeActionsMutation(message.actions)
        if (!result) return

        const failed = result.results.find(entry => entry.result?.error)
        updateMessage(message.id, failed ? { status: 'error', note: failed.result.error } : { status: 'confirmed' })
    }

    const cancelActions = (message) => updateMessage(message.id, { status: 'cancelled' })

    return (
        <div className="h-3/5 w-full flex flex-col bg-slate-300 border-b border-black">
            <div className="h-full w-full overflow-y-auto py-2">
                {messages.length === 0 && !loading && (
                    <p className="px-3 text-sm text-slate-500">Ask the agent something.</p>
                )}
                <List
                    items={messages}
                    keyExtractor={message => message.id}
                    flow="x"
                    slots={1}
                    autoSize="auto"
                    className="w-full"
                    itemClassName="px-3 py-1"
                >
                    {message => {
                        if (message.role === 'confirmation') return (
                            <div className="w-full flex justify-center">
                                <div className="max-w-4/5 w-full flex flex-col gap-2 p-3 bg-white border border-black">
                                    <p className="text-sm font-bold">Create these items?</p>
                                    <ul className="text-sm list-disc pl-4">
                                        {pendingItems(message.actions).map((item, index) => (
                                            <li key={index}>{item.title} — {item.itemType} in {item.theme}</li>
                                        ))}
                                    </ul>
                                    {message.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => confirmActions(message)} disabled={executing} className="px-3 py-1 text-sm text-white bg-slate-700 disabled:opacity-50">Confirm</button>
                                            <button type="button" onClick={() => cancelActions(message)} disabled={executing} className="px-3 py-1 text-sm bg-slate-200 disabled:opacity-50">Cancel</button>
                                        </div>
                                    )}
                                    {message.status === 'confirmed' && <p className="text-sm text-green-700">Created.</p>}
                                    {message.status === 'cancelled' && <p className="text-sm text-slate-500">Cancelled.</p>}
                                    {message.status === 'error' && <p className="text-sm text-red-600">{message.note}</p>}
                                </div>
                            </div>
                        )

                        if (message.role === 'tool') return (
                            <div className="w-full flex justify-start">
                                <span className="max-w-4/5 px-2 text-xs italic text-slate-500">
                                    {message.text}
                                </span>
                            </div>
                        )

                        return (
                            <div className={`w-full flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <span className={`max-w-4/5 p-2 text-sm whitespace-pre-wrap ${message.role === 'user' ? 'bg-slate-100' : 'bg-white'}`}>
                                    {message.text}
                                </span>
                            </div>
                        )
                    }}
                </List>
                {loading && <p className="px-3 py-1 text-sm text-slate-500">Thinking...</p>}
            </div>
            <form onSubmit={runSendPrompt} className="w-full flex border-t border-black">
                <input
                    type="text"
                    value={prompt}
                    onChange={event => setPrompt(event.target.value)}
                    disabled={loading}
                    placeholder="Send a prompt..."
                    className="w-full p-2 text-sm bg-slate-100 outline-none"
                />
                <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="px-4 text-sm text-white bg-slate-700 disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    )
}
