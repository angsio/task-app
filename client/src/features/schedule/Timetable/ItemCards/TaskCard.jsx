import { updateItem } from '../../../../api'
import { useMutation } from '../../../../hooks'
import { useScheduleContext } from '../../ScheduleContext'
import { toHourMinute } from '../time'

const styles = {
    card:        'bg-slate-100',
    body:        'text-sm',
    label:       'font-bold',
    title:       'truncate leading-6',
    done:        'line-through',
    completeBtn: 'text-left text-slate-500 hover:underline hover:cursor-pointer',
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
                    Mark Complete
                </button>
            </div>
        </div>
    )
}