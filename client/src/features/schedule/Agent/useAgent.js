import { useState } from 'react'

import { sendTurn } from '../../../api'
import { useMutation } from '../../../hooks'
import { useItems, useThemes } from '../../../data'

// (doc) -> boolean, true for an item, false for a theme. Only items carry a
// discriminator, so it says which cache a document belongs in.
const isItem = (doc) => Boolean(doc.itemType)

/*
  The agent conversation.

  In:  nothing. It reads the theme and item caches itself.

  Out: { messages, pending, busy, ask, approve, decline }
       messages  message[], the transcript so far
       pending   action[], each { id, name, lines: string[] } awaiting a yes/no
       busy      boolean, true while a turn is in flight
       ask       (text: string) -> Promise<void>, send a prompt
       approve   () -> Promise<void>, run the pending actions
       decline   () -> Promise<void>, answer no; the agent carries on and says so

  Anything the agent wrote comes back as `documents` and anything it deleted as
  `removed`, each sorted into the shared theme and item caches, so the board
  updates without a refetch and without disturbing this conversation.
*/
export const useAgent = () => {
    const [messages, setMessages] = useState([])
    const [pending, setPending] = useState([])

    const { mutate: sendTurnMutation, loading: busy } = useMutation(sendTurn)
    const { upsert: upsertItem, remove: removeItem } = useItems()
    const { upsert: upsertTheme, remove: removeTheme } = useThemes()

    const take = (turn) => {
        setMessages(turn.messages)
        setPending(turn.pending)

        upsertItem(...turn.documents.filter(isItem))
        upsertTheme(...turn.documents.filter(doc => !isItem(doc)))
        removeItem(...turn.removed.filter(isItem))
        removeTheme(...turn.removed.filter(doc => !isItem(doc)))
    }

    const ask = async (text) => {
        const asked = [...messages, { role: 'user', content: text }]
        setMessages(asked)
        setPending([])

        const turn = await sendTurnMutation(asked)
        if (turn) take(turn)
    }

    const answer = async (approved) => {
        const turn = await sendTurnMutation(messages, approved)
        if (turn) take(turn)
    }

    return {
        messages,
        pending,
        busy,
        ask,
        approve: () => answer(true),
        decline: () => answer(false),
    }
}
