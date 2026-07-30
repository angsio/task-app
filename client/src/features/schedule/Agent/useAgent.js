import { useState } from 'react'

import { sendTurn } from '../../../api'
import { useMutation } from '../../../hooks'
import { useScheduleContext } from '../ScheduleContext'

/*
  The agent conversation.

  The server keeps no session, so the transcript IS the state and it round-trips
  on every turn. This hook owns it, along with whatever is waiting on the user's
  yes/no, so the panel below only renders.

  In:  nothing — it reads upsertItem from ScheduleContext.

  Out: { messages, pending, busy, ask, approve, decline }
       messages  message[], the transcript so far
       pending   action[], each { id, name, lines: string[] } awaiting a yes/no
       busy      boolean, true while a turn is in flight
       ask       (text: string) -> Promise<void>, send a prompt
       approve   () -> Promise<void>, run the pending actions
       decline   () -> Promise<void>, answer no; the agent carries on and says so

  Anything the agent wrote comes back as `documents` and is upserted into the
  shared item cache, so the timetable updates without a refetch and without
  disturbing this conversation.
*/
export const useAgent = () => {
    const [messages, setMessages] = useState([])
    const [pending, setPending] = useState([])

    const { mutate: sendTurnMutation, loading: busy } = useMutation(sendTurn)
    const { upsertItem } = useScheduleContext()

    const take = (turn) => {
        setMessages(turn.messages)
        setPending(turn.pending)
        turn.documents.forEach(upsertItem)
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
