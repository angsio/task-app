import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'

import { List } from '../../../components'
import { useAgent } from './useAgent'
import { toBubbles } from './transcript'

const styles = {
    panel:        'bg-obsidian border-b border-border',
    hint:         'text-sm text-ash',
    toolText:     'text-xs italic text-ash',
    bubble:       'text-sm whitespace-pre-wrap rounded-md',
    userBg:       'border border-accent/20 bg-accent/10 text-parchment',
    agentBg:      'border border-border bg-crypt text-parchment',
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
    const { messages, pending, busy, ask, approve, decline } = useAgent()

    const bubbles = toBubbles(messages)

    const send = (event) => {
        event.preventDefault()
        if (!input.trim() || busy) return

        ask(input)
        setInput('')
    }

    const sendOnEnter = (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return

        send(event)
    }

    return (
        <div className={`h-3/5 w-full flex flex-col ${styles.panel}`}>
            <div className="w-full flex-1 min-h-0 overflow-y-auto py-2">
                
                {bubbles.length === 0 && !busy && (
                    <p className={`px-3 ${styles.hint}`}>Ask the agent something.</p>
                )}
                
                <List
                    items={bubbles}
                    keyExtractor={bubble => bubble.key}
                    className="w-full"
                    itemClassName="px-3 py-1"
                >
                    {bubble => bubble.kind === 'tool' ? (
                        <div className="w-full flex justify-start">
                            <span className={`max-w-4/5 px-2 ${styles.toolText}`}>{bubble.text}</span>
                        </div>
                    ) : (
                        <div className={`w-full flex ${bubble.kind === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <span className={`max-w-4/5 p-2 ${styles.bubble} ${bubble.kind === 'user' ? styles.userBg : styles.agentBg}`}>
                                {bubble.text}
                            </span>
                        </div>
                    )}
                </List>

                {pending.length > 0 && (
                    <div className="w-full flex justify-center px-3 py-1">
                        <div className={`max-w-4/5 w-full flex flex-col gap-2 p-3 ${styles.confirmBox}`}>
                            <p className={styles.confirmTitle}>Confirm these actions?</p>
                            <ul className={`pl-4 ${styles.itemList}`}>
                                {pending.flatMap(action => action.lines).map((line, index) => (
                                    <li key={index}>{line}</li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <button type="button" onClick={approve} disabled={busy} className={`px-3 py-1 ${styles.primaryBtn}`}>Confirm</button>
                                <button type="button" onClick={decline} disabled={busy} className={`px-3 py-1 ${styles.cancelBtn}`}>Cancel</button>
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
