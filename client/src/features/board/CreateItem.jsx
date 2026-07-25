import { useState } from 'react'
import { useMutation } from '../../hooks'
import { createItem } from '../../api'
import { EditableText } from '../../components'
import { useBoardContext } from './BoardContext'

const ITEM_TYPES = ['Task', 'Event', 'Reminder']

const styles = {
    draft:  'bg-crypt border border-border rounded-md',
    input:  'h-full bg-transparent text-center text-parchment focus:outline-none',
    select: 'bg-void border border-border rounded-md text-center text-parchment-dim transition-colors hover:border-accent focus:border-accent focus:outline-none',
}

const defaultsFor = (type) => {
    if (type === 'Event') {
        const start = new Date()
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        return { timeStart: start.toISOString(), timeEnd: end.toISOString() }
    }
    if (type === 'Reminder') {
        return { reminderTime: new Date().toISOString() }
    }
    if (type === 'Task') {
        return { deadline: new Date().toISOString() }
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
            <div className={`h-full w-full p-4 ${styles.draft}`}>
                <EditableText
                    value=""
                    active
                    onSubmit={submitCreateItem}
                    onCancel={cancelCreateItem}
                    disabled={loading}
                    placeholder={`New ${type}`}
                    maxLength={60}
                    className="h-full w-full"
                    inputClassName={styles.input}
                />
            </div>
        )
    }

    return (
        <select
            className={`h-full w-full ${styles.select}`}
            value=""
            onChange={(event) => setType(event.target.value)}
        >
            <option value="" disabled>Create new</option>
            {ITEM_TYPES.map(name => (
                <option key={name} value={name}>{name}</option>
            ))}
        </select>
    )
}
