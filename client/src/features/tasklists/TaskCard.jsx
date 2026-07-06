import { useState } from 'react'
import { updateTask, deleteTask } from '../../api'
import { useMutation } from '../../hooks'
import { EditableText } from '../../components'
import { useTaskListsContext } from './TaskListsContext'

export const TaskCard = ({ taskListId, task }) => {

    const [updatingTaskNameField, setUpdatingTaskNameField] = useState(false)

    const { mutate: updateTaskMutation, loading: updatingTask } = useMutation(updateTask)
    const { mutate: deleteTaskMutation, loading: deletingTask } = useMutation(deleteTask)

    const { handleTaskListUpdated } = useTaskListsContext()

    const runUpdateTaskCompleted = async () => {
        const updatedTaskList = await updateTaskMutation(taskListId, task._id, { completed: !task.completed, name: null })
        if (!updatedTaskList) return

        handleTaskListUpdated(updatedTaskList)
    }

    const runDeleteTask = async () => {
        const deletedTaskTaskList = await deleteTaskMutation(taskListId, task._id)
        if (!deletedTaskTaskList) return

        handleTaskListUpdated(deletedTaskTaskList)
    }

    const submitUpdateTaskName = async (newName) => {
        if (!newName.trim()) { setUpdatingTaskNameField(false); return false }

        const updatedTaskList = await updateTaskMutation(taskListId, task._id, { completed: null, name: newName })
        if (!updatedTaskList) return

        handleTaskListUpdated(updatedTaskList)
        setUpdatingTaskNameField(false)
    }

    const cancelUpdateTaskName = () => setUpdatingTaskNameField(false)

    return (
        <div className="h-12 w-full flex flex-row items-center justify-between px-4">
            <EditableText
                value={task.name}
                active={updatingTaskNameField}
                onSubmit={submitUpdateTaskName}
                onCancel={cancelUpdateTaskName}
                disabled={updatingTask}
            />
            <div className="flex flex-row gap-4">
                <button
                    type="button"
                    className={`h-4 w-4 ${task.completed ? 'bg-gray-500' : 'bg-gray-200'}`}
                    onClick={runUpdateTaskCompleted}
                />
                <button 
                    type="button"
                    className="h-4 w-4 bg-sky-600"
                    onClick={() => setUpdatingTaskNameField(true)}
                />
                <button 
                    type="button"
                    className="h-4 w-4 bg-red-600"
                    onClick={runDeleteTask}
                />
            </div>
        </div>
    )
}
