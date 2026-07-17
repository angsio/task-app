import { useState } from 'react'

import { sendPrompt } from '../../../api'
import { useMutation } from '../../../hooks'
import { List } from '../../../components'

export const Agent = () => {

    const [prompt, setPrompt] = useState('')
    const [messages, setMessages] = useState([])

    const { mutate: sendPromptMutation, loading } = useMutation(sendPrompt)

    const appendMessage = (role, text) => {
        setMessages(current => [...current, { id: crypto.randomUUID(), role, text }])
    }

    const runSendPrompt = async (event) => {
        event.preventDefault()
        if (!prompt.trim() || loading) return

        const text = prompt
        appendMessage('user', text)
        setPrompt('')

        const result = await sendPromptMutation(text)
        if (!result) return

        appendMessage('assistant', result.reply)
    }

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
                    {message => (
                        <div className={`w-full flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <span className={`max-w-4/5 p-2 text-sm whitespace-pre-wrap ${message.role === 'user' ? 'bg-slate-100' : 'bg-white'}`}>
                                {message.text}
                            </span>
                        </div>
                    )}
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
