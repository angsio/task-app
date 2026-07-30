import { faPen, faTrash, faClock, faSquare, faSquareCheck } from '@fortawesome/free-solid-svg-icons'
import { EditableText, IconButton, DateTimeField } from '../../../components'
import { useItemCard } from './useItemCard'

const styles = {
    card:        'bg-crypt border border-border rounded-md',
    label:       'font-display text-accent',
    title:       'text-parchment',
    titleDone:   'text-ash line-through',
    input:       'bg-void border border-border rounded-md px-2 text-parchment focus:border-accent focus:outline-none',
    editBtn:     'text-parchment-dim transition-colors hover:text-accent-bright',
    deleteBtn:   'text-parchment-dim transition-colors hover:text-danger',
    deadlineOn:  'text-accent-teal transition-colors',
    deadlineOff: 'text-ash transition-colors hover:text-parchment-dim',
    doneOn:      'text-accent transition-colors',
    doneOff:     'text-ash transition-colors hover:text-parchment-dim',
}

export const TaskCard = ({ item }) => {
    const { renaming, startRename, submitRename, cancelRename, runDelete, patch, busy } = useItemCard(item)

    return (
        <div className={`h-full w-full flex flex-col p-4 ${styles.card}`}>
            <div className="h-1/5 w-full flex items-center justify-between">
                <div className="flex-1 min-w-0 flex items-center gap-1">
                    <span className={styles.label}>Task:</span>
                    <EditableText
                        value={item.title}
                        active={renaming}
                        onSubmit={submitRename}
                        onCancel={cancelRename}
                        disabled={busy}
                        maxLength={60}
                        className={`flex-1 min-w-0 ${item.completed ? styles.titleDone : styles.title}`}
                        inputClassName={styles.input}
                    />
                </div>
                <div className="flex gap-4">
                    <IconButton icon={faPen} title="Rename" onClick={startRename} className={styles.editBtn} />
                    <IconButton icon={faTrash} title="Delete" onClick={runDelete} className={styles.deleteBtn} />
                </div>
            </div>
            <div className="h-4/5 w-full flex flex-col pt-4">
                <div className="h-1/2 w-full">
                    {item.hasDeadline && (
                        <DateTimeField
                            label="Time:"
                            value={item.deadline}
                            onCommit={value => patch({ deadline: value })}
                            className="h-full"
                        />
                    )}
                </div>
                <div className="h-1/2 w-full flex items-end gap-4">
                    <IconButton
                        icon={faClock}
                        title="Has deadline"
                        onClick={() => patch({ hasDeadline: !item.hasDeadline })}
                        disabled={busy}
                        className={item.hasDeadline ? styles.deadlineOn : styles.deadlineOff}
                    />
                    <IconButton
                        icon={item.completed ? faSquareCheck : faSquare}
                        title={item.completed ? 'Completed' : 'Mark complete'}
                        onClick={() => patch({ completed: !item.completed })}
                        disabled={busy}
                        className={item.completed ? styles.doneOn : styles.doneOff}
                    />
                </div>
            </div>
        </div>
    )
}
