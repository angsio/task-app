import { useState } from 'react'
import { updateItem, deleteItem } from '../../../api'
import { useMutation } from '../../../hooks'
import { EditableText } from '../../../components'
import { useBoardContext } from '../BoardContext'
import { toDateTimeLocal } from './timeUtils'

const styles = {
    card:       'bg-white',
    input:      'bg-white',
    editBtn:    'bg-slate-500',
    deleteBtn:  'bg-red-500',
    field:      'bg-slate-300',
    fieldInput: 'text-center bg-slate-300',
}

export const ReminderCard = ({ item }) => {
    const [renaming, setRenaming] = useState(false)

    const { mutate: updateItemMutation, loading: updatingItem } = useMutation(updateItem)
    const { mutate: deleteItemMutation, loading: deletingItem } = useMutation(deleteItem)

    const { upsertItem, removeItem } = useBoardContext()

    const submitRenameReminder = async (title) => {
        if (!title.trim()) {
            setRenaming(false)
            return
        }

        const updated = await updateItemMutation(item._id, { title })
        if (!updated) return

        upsertItem(updated)
        setRenaming(false)
    }

    const cancelRenameReminder = () => setRenaming(false)

    const runDeleteReminder = async () => {
        const deleted = await deleteItemMutation(item._id)
        if (!deleted) return

        removeItem(deleted)
    }

    const runUpdateReminderTime = async (value) => {
        const updated = await updateItemMutation(item._id, { reminderTime: value })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <div className={`h-full w-full flex flex-col p-4 ${styles.card}`}>
            <div className="h-1/5 w-full flex flex-row items-center justify-between">
                <div className="flex items-center gap-1">
                    <span>Reminder:</span>
                    <EditableText
                        value={item.title}
                        active={renaming}
                        onSubmit={submitRenameReminder}
                        onCancel={cancelRenameReminder}
                        disabled={updatingItem || deletingItem}
                        inputClassName={`flex-1 ${styles.input}`}
                    />
                </div>
                <div className="flex flex-row gap-4">
                    <button
                        type="button"
                        className={`h-4 w-4 ${styles.editBtn}`}
                        onClick={() => setRenaming(true)}
                    />
                    <button
                        type="button"
                        className={`h-4 w-4 ${styles.deleteBtn}`}
                        onClick={runDeleteReminder}
                    />
                </div>
            </div>
            <div className="h-4/5 w-full flex items-center pt-4">
                <div className={`h-1/2 w-full flex flex-row items-center pl-4 ${styles.field}`}>
                    <span className="w-1/4">Time:</span>
                    <input
                        type="datetime-local"
                        className={`h-full w-3/4 ${styles.fieldInput}`}
                        defaultValue={toDateTimeLocal(item.reminderTime)}
                        onChange={(event) => runUpdateReminderTime(event.target.value)}
                        disabled={updatingItem}
                    />
                </div>
            </div>
        </div>
    )
}
