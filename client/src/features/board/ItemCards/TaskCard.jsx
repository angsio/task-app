import { useState } from 'react'
import { updateItem, deleteItem } from '../../../api'
import { useMutation } from '../../../hooks'
import { EditableText } from '../../../components'
import { useBoardContext } from '../BoardContext'

export const TaskCard = ({ item }) => {
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

    const runToggleCompleted = async () => {
        const updated = await updateItemMutation(item._id, { completed: !item.completed })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <div className="h-full w-full flex flex-col p-4 bg-white">
            <div className="h-1/5 w-full flex flex-row items-center justify-between">
                <div>
                    <span className="mr-1">Task:</span>
                    <EditableText
                        value={item.title}
                        active={renaming}
                        onSubmit={submitRenameItem}
                        onCancel={cancelRenameItem}
                        disabled={updatingItem || deletingItem}
                        inputClassName="flex-1 bg-white"
                    />
                </div>
                <div className="flex flex-row ml-4 gap-4">
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
                </div>
            </div>
            <div className="h-4/5 w-full flex items-end justify-end">
                <div className="flex items-center">
                    <span className="mr-1">Completed</span>
                    <button
                        type="button"
                        className={`h-4 w-4 ${item.completed ? 'bg-green-500' : 'bg-green-200'}`}
                        onClick={runToggleCompleted}
                        disabled={updatingItem}
                    />
                </div>
            </div>
        </div>
    )
}
