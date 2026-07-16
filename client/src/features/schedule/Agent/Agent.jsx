import { useState } from 'react'

import { sendPrompt } from '../../../api'
import { useMutation } from '../../../hooks'

export const Agent = () => {

    const [prompt, setPrompt] = useState('')
    const [reply, setReply] = useState(null)

    const { mutate: sendPromptMutation, loading } = useMutation(sendPrompt)

    const runSendPrompt = async (event) => {
        event.preventDefault()
        if (!prompt.trim() || loading) return

        const result = await sendPromptMutation(prompt)
        if (!result) return

        setReply(result.reply)
        setPrompt('')
    }

    return (
        <div className="h-3/5 w-full flex flex-col bg-slate-300 border-b border-black">
            <div className="h-full w-full overflow-y-auto p-3 text-sm whitespace-pre-wrap">
                {loading
                    ? <span className="text-slate-500">Thinking...</span>
                    : <span className={reply ? '' : 'text-slate-500'}>
                        {reply ?? 'Ask the agent something.'}
                    </span>}
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
