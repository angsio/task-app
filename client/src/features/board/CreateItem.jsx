import { useState } from 'react'
import { useMutation } from '../../hooks'
import { createItem } from '../../api'
import { EditableText } from '../../components'
import { useBoardContext } from './BoardContext'

const ITEM_TYPES = ['Task', 'Event', 'Reminder']

const defaultsFor = (type) => {
    if (type === 'Event') {
        const start = new Date()
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        return { timeStart: start.toISOString(), timeEnd: end.toISOString() }
    }
    if (type === 'Reminder') {
        return { reminderTime: new Date().toISOString() }
    }
    return {}
}

export const CreateItem = ({ themeId }) => {
    const [type, setType] = useState(null)

    const { mutate: createItemMutation, loading } = useMutation(createItem)
    const { upsertItem } = useBoardContext()

    const submitCreateItem = async (title) => {
        if (!title.trim()) {
            setType(null)
            return
        }

        const created = await createItemMutation({
            itemType: type,
            theme: themeId,
            title,
            ...defaultsFor(type),
        })
        if (!created) return

        upsertItem(created)
        setType(null)
    }

    const cancelCreateItem = () => setType(null)

    if (type) {
        return (
            <div className="w-full h-full p-4 bg-slate-50">
                <EditableText
                    value=""
                    active
                    onSubmit={submitCreateItem}
                    onCancel={cancelCreateItem}
                    disabled={loading}
                    placeholder={`New ${type}`}
                    inputClassName="h-full w-full text-center bg-white"
                />
            </div>
        )
    }

    return (
        <select
            className="h-full w-full text-center bg-white"
            value=""
            onChange={(event) => setType(event.target.value)}
        >
            <option value="" disabled>Create new…</option>
            {ITEM_TYPES.map(name => (
                <option key={name} value={name}>{name}</option>
            ))}
        </select>
    )
}
