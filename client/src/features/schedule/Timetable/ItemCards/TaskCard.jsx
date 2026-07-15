import { updateItem } from '../../../../api'
import { useMutation } from '../../../../hooks'
import { useScheduleContext } from '../../ScheduleContext'
import { toHourMinute } from '../time'

export const TaskCard = ({ item: task, color }) => {

    const { mutate: updateTaskMutation, loading: updatingTask } = useMutation(updateItem)

    const { upsertItem } = useScheduleContext()

    const runToggleTaskCompleted = async () => {
        const updated = await updateTaskMutation(task._id, { completed: !task.completed })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <div className="h-full w-full relative flex flex-row bg-slate-100">
            <div
                className="absolute left-0 h-full w-2 hover:w-4 transition-[width] duration-200 ease-out"
                style={{ backgroundColor: color }}
            />
            <div className="h-full w-full flex flex-col pl-6">
                <div className={`text-sm ${task.completed ? 'line-through' : '' }`}>
                    <span className="font-bold">Task: </span>{task.title}
                </div>
                <div className={`text-sm ${task.completed ? 'line-through' : ''}`}>
                    <span className="font-bold">Deadline: </span>{toHourMinute(task.deadline)}
                </div>
                <button
                    type="button"
                    className="text-slate-500 text-left text-sm hover:underline hover:cursor-pointer"
                    onClick={runToggleTaskCompleted}
                >
                    Mark Complete
                </button>
            </div>
        </div>
    )
}