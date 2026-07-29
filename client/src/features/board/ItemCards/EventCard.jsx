import { useState } from 'react'
import { updateItem, deleteItem } from '../../../api'
import { useMutation } from '../../../hooks'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { EditableText, IconButton, DateTimeField } from '../../../components'
import { useBoardContext } from '../BoardContext'

const styles = {
    card:      'bg-crypt border border-border rounded-md',
    label:     'font-display text-accent-teal',
    title:     'text-parchment',
    input:     'bg-void border border-border rounded-md px-2 text-parchment focus:border-accent focus:outline-none',
    editBtn:   'text-parchment-dim transition-colors hover:text-accent-bright',
    deleteBtn: 'text-parchment-dim transition-colors hover:text-danger',
}

export const EventCard = ({ item }) => {
    const [renaming, setRenaming] = useState(false)

    const { mutate: updateItemMutation, loading: updatingItem } = useMutation(updateItem)
    const { mutate: deleteItemMutation, loading: deletingItem } = useMutation(deleteItem)

    const { upsertItem, removeItem } = useBoardContext()

    const submitRenameEvent = async (title) => {
        if (!title.trim()) {
            setRenaming(false)
            return
        }

        const updated = await updateItemMutation(item._id, { title })
        if (!updated) return

        upsertItem(updated)
        setRenaming(false)
    }

    const cancelRenameEvent = () => setRenaming(false)

    const runDeleteEvent = async () => {
        const deleted = await deleteItemMutation(item._id)
        if (!deleted) return

        removeItem(deleted)
    }

    const runUpdateField = async (field, value) => {
        const updated = await updateItemMutation(item._id, { [field]: value })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <div className={`h-full w-full flex flex-col p-4 ${styles.card}`}>
            <div className="h-1/5 w-full flex flex-row items-center justify-between">
                <div className="flex-1 min-w-0 flex items-center gap-1">
                    <span className={styles.label}>Event:</span>
                    <EditableText
                        value={item.title}
                        active={renaming}
                        onSubmit={submitRenameEvent}
                        onCancel={cancelRenameEvent}
                        disabled={updatingItem || deletingItem}
                        maxLength={60}
                        className={`flex-1 min-w-0 ${styles.title}`}
                        inputClassName={styles.input}
                    />
                </div>
                <div className="flex flex-row gap-4">
                    <IconButton icon={faPen} title="Rename" onClick={() => setRenaming(true)} className={styles.editBtn} />
                    <IconButton icon={faTrash} title="Delete" onClick={runDeleteEvent} className={styles.deleteBtn} />
                </div>
            </div>
            <div className="h-4/5 w-full flex flex-col pt-4 gap-1">
                <DateTimeField
                    label="Start:"
                    value={item.timeStart}
                    onCommit={value => runUpdateField('timeStart', value)}
                    className="flex-1 min-h-0"
                />
                <DateTimeField
                    label="End:"
                    value={item.timeEnd}
                    onCommit={value => runUpdateField('timeEnd', value)}
                    className="flex-1 min-h-0"
                />
            </div>
        </div>
    )
}