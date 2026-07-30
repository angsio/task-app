import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { EditableText, IconButton, DateTimeField } from '../../../components'
import { useItemCard } from './useItemCard'

const styles = {
    card:      'bg-crypt border border-border rounded-md',
    label:     'font-display text-accent-teal',
    title:     'text-parchment',
    input:     'bg-void border border-border rounded-md px-2 text-parchment focus:border-accent focus:outline-none',
    editBtn:   'text-parchment-dim transition-colors hover:text-accent-bright',
    deleteBtn: 'text-parchment-dim transition-colors hover:text-danger',
}

export const EventCard = ({ item }) => {
    const { renaming, startRename, submitRename, cancelRename, runDelete, patch, busy } = useItemCard(item)

    return (
        <div className={`h-full w-full flex flex-col p-4 ${styles.card}`}>
            <div className="h-1/5 w-full flex items-center justify-between">
                <div className="flex-1 min-w-0 flex items-center gap-1">
                    <span className={styles.label}>Event:</span>
                    <EditableText
                        value={item.title}
                        active={renaming}
                        onSubmit={submitRename}
                        onCancel={cancelRename}
                        disabled={busy}
                        maxLength={60}
                        className={`flex-1 min-w-0 ${styles.title}`}
                        inputClassName={styles.input}
                    />
                </div>
                <div className="flex gap-4">
                    <IconButton icon={faPen} title="Rename" onClick={startRename} className={styles.editBtn} />
                    <IconButton icon={faTrash} title="Delete" onClick={runDelete} className={styles.deleteBtn} />
                </div>
            </div>
            <div className="h-4/5 w-full flex flex-col pt-4 gap-1">
                <DateTimeField
                    label="Start:"
                    value={item.timeStart}
                    onCommit={value => patch({ timeStart: value })}
                    className="flex-1 min-h-0"
                />
                <DateTimeField
                    label="End:"
                    value={item.timeEnd}
                    onCommit={value => patch({ timeEnd: value })}
                    className="flex-1 min-h-0"
                />
            </div>
        </div>
    )
}
