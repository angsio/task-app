import { useState } from 'react'
import { updateItem, deleteItem } from '../../../api'
import { useMutation } from '../../../hooks'
import { EditableText } from '../../../components'
import { useBoardContext } from '../BoardContext'
import { toDateTimeLocal } from './timeUtils'

export const TaskCard = ({ item }) => {
    const [renaming, setRenaming] = useState(false)

    const { mutate: updateItemMutation, loading: updatingItem } = useMutation(updateItem)
    const { mutate: deleteItemMutation, loading: deletingItem } = useMutation(deleteItem)

    const { upsertItem, removeItem } = useBoardContext()

    const submitRenameTask = async (title) => {
        if (!title.trim()) {
            setRenaming(false)
            return
        }

        const updated = await updateItemMutation(item._id, { title })
        if (!updated) return

        upsertItem(updated)
        setRenaming(false)
    }

    const cancelRenameTask = () => setRenaming(false)

    const runDeleteTask = async () => {
        const deleted = await deleteItemMutation(item._id)
        if (!deleted) return

        removeItem(deleted)
    }

    const runToggleTaskHasDeadline = async () => {
        const updated = await updateItemMutation(item._id, { hasDeadline: !item.hasDeadline })
        if (!updated) return

        upsertItem(updated)
    }

    const runToggleTaskCompleted = async () => {
        const updated = await updateItemMutation(item._id, { completed: !item.completed })
        if (!updated) return

        upsertItem(updated)
    }

    const runUpdateTaskDeadline = async (value) => {
        const updated = await updateItemMutation(item._id, { deadline: value })
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
                        onSubmit={submitRenameTask}
                        onCancel={cancelRenameTask}
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
                        onClick={runDeleteTask}
                    />
                </div>
            </div>
            <div className="h-4/5 w-full flex flex-col pt-4">
                <div className="h-1/2 w-full">
                    {item.hasDeadline && (
                        <div className="h-full w-full flex flex-row items-center bg-slate-300 pl-4">
                            <span className="w-1/4">Time:</span>
                            <input
                                type="datetime-local"
                                className="h-full w-3/4 text-center bg-slate-300"
                                defaultValue={toDateTimeLocal(item.deadline)}
                                onChange={event => runUpdateTaskDeadline(event.target.value)}
                                disabled={updatingItem}
                            />
                        </div>
                    )}
                </div>
                <div className="h-1/2 w-full flex items-end gap-4">
                    <div className="flex items-center">
                        <button 
                            type="button"
                            className={`h-4 w-4 ${item.hasDeadline ? 'bg-orange-500' : 'bg-orange-200'}`}
                            onClick={runToggleTaskHasDeadline}
                            disabled={updatingItem}
                        />
                        <span className="ml-2">Has Deadline</span>
                    </div>
                    <div className="flex items-center">
                        <button
                            type="button"
                            className={`h-4 w-4 ${item.completed ? 'bg-green-500' : 'bg-green-200'}`}
                            onClick={runToggleTaskCompleted}
                            disabled={updatingItem}
                        />
                        <span className="ml-2">Completed</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
