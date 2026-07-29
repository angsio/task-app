import { updateItem } from '../../../../api'
import { useMutation } from '../../../../hooks'
import { useScheduleContext } from '../../ScheduleContext'
import { toHourMinute } from '../time'

const styles = {
    card:        'bg-crypt border border-border rounded-sm',
    body:        'text-sm text-parchment',
    label:       'font-display text-parchment-dim',
    title:       'truncate leading-6',
    done:        'text-ash line-through',
    completeBtn: 'text-left text-accent transition-colors hover:text-accent-bright hover:cursor-pointer',
}

export const TaskCard = ({ item: task, color }) => {

    const { mutate: updateTaskMutation } = useMutation(updateItem)
    const { upsertItem } = useScheduleContext()

    const runToggleTaskCompleted = async () => {
        const updated = await updateTaskMutation(task._id, { completed: !task.completed })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <div className={`relative h-full w-full flex flex-row ${styles.card}`}>
            <div
                className="absolute left-0 h-full w-2"
                style={{ backgroundColor: color }}
            />
            <div className={`h-full w-full flex flex-col pl-6 ${styles.body}`}>
                <div className={`shrink-0 ${styles.title} ${task.completed ? styles.done : ''}`}>
                    <span className={styles.label}>Task: </span>{task.title}
                </div>
                <div className={task.completed ? styles.done : undefined}>
                    <span className={styles.label}>Deadline: </span>{toHourMinute(task.deadline)}
                </div>
                <button
                    type="button"
                    className={styles.completeBtn}
                    onClick={runToggleTaskCompleted}
                >
                    {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
            </div>
        </div>
    )
}