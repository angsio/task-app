import { useState } from 'react'
import { useMutation } from '../../hooks'
import { createItem } from '../../api'
import { EditableText } from '../../components'
import { useBoardContext } from './BoardContext'
import { ITEM_TYPES } from './itemTypes'

export const CreateItem = ({ themeId }) => {
    const [type, setType] = useState(null)

    const { mutate: createItemMutation, loading } = useMutation(createItem)
    const { upsertItem } = useBoardContext()

    const submitCreateItem = async (title) => {
        if (!title.trim()) {
            setType(null)
            return
        }

        const { defaults } = ITEM_TYPES[type]
        const created = await createItemMutation({
            itemType: type,
            theme: themeId,
            title,
            ...(defaults?.() ?? {}),
        })
        if (!created) return

        upsertItem(created)
        setType(null)
    }

    const cancelCreateItem = () => setType(null)

    if (type) {
        return (
            <div className="flex flex-col gap-4 p-4 bg-slate-50">
                <EditableText
                    value=""
                    active
                    onSubmit={submitCreateItem}
                    onCancel={cancelCreateItem}
                    disabled={loading}
                    placeholder={`New ${type}`}
                    inputClassName="w-full bg-white"
                />
            </div>
        )
    }

    return (
        <select
            className="bg-white"
            value=""
            onChange={(event) => setType(event.target.value)}
        >
            <option value="" disabled>Create new…</option>
            {Object.keys(ITEM_TYPES).map(name => (
                <option key={name} value={name}>{name}</option>
            ))}
        </select>
    )
}
