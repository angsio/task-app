import { useState } from 'react'
import { updateItem, deleteItem } from '../../api'
import { useMutation } from '../../hooks'
import { EditableText } from '../../components'
import { useBoardContext } from './BoardContext'
import { ITEM_TYPES } from './itemTypes'

export const ItemCard = ({ item }) => {
    const [renaming, setRenaming] = useState(false)

    const { mutate: updateItemMutation, loading: updatingItem } = useMutation(updateItem)
    const { mutate: deleteItemMutation, loading: deletingItem } = useMutation(deleteItem)

    const { upsertItem, removeItem } = useBoardContext()

    const submitRenameItem = async (title) => {
        if (!title.trim()) {
            setRenaming(false)
            return
        }

        const updated = await updateItemMutation(item._id, { title })
        if (!updated) return

        upsertItem(updated)
        setRenaming(false)
    }

    const cancelRenameItem = () => setRenaming(false)

    const runDeleteItem = async () => {
        const deleted = await deleteItemMutation(item._id)
        if (!deleted) return

        removeItem(deleted)
    }

    const { Action, Fields } = ITEM_TYPES[item.itemType] ?? {}

    return (
        <div className="flex flex-col gap-4 p-4 bg-slate-50">
            <div className="flex flex-row items-start justify-between gap-4">
                <EditableText
                    value={item.title}
                    active={renaming}
                    onSubmit={submitRenameItem}
                    onCancel={cancelRenameItem}
                    disabled={updatingItem || deletingItem}
                    inputClassName="flex-1 bg-white"
                />
                <div className="flex flex-col gap-4">
                    <button
                        type="button"
                        className="h-4 w-4 bg-slate-500"
                        onClick={() => setRenaming(true)}
                    />
                    <button
                        type="button"
                        className="h-4 w-4 bg-red-500"
                        onClick={runDeleteItem}
                    />
                    {Action && <Action item={item} />}
                </div>
            </div>
            {Fields && <Fields item={item} />}
        </div>
    )
}
