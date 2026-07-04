import { useState } from 'react'
import { updateTaskList, deleteTaskList } from '../../api'
import { useSubmit } from '../../hooks'
import { EditableText } from '../../components'
import { useTaskListsContext } from './TaskListsContext'

export const TaskListCard = ({ taskList }) => {
    const [isEditingName, setIsEditingName] = useState(false)

    const { submit: submitUpdate, loading: updating } = useSubmit(updateTaskList)
    const { submit: submitDelete } = useSubmit(deleteTaskList)

    const { handleTaskListUpdated, handleTaskListDeleted } = useTaskListsContext()

    const handleDelete = async () => {
        const id = await submitDelete(taskList._id)
        if (!id) return

        handleTaskListDeleted(id)
    }

    const handleNameSubmit = async (newName) => {
        const updated = await submitUpdate(taskList._id, newName)
        if (!updated) return

        handleTaskListUpdated(updated)
        setIsEditingName(false)
    }

    const handleNameCancel = () => setIsEditingName(false)

    return (
        <div className="flex flex-col w-full border p-4 gap-4">
            <div className="flex flex-row items-center justify-between shrink-0 px-4">
                <EditableText
                    value={taskList.name}
                    active={isEditingName}
                    onSubmit={handleNameSubmit}
                    onCancel={handleNameCancel}
                    disabled={updating}
                />
                <div className="flex flex-row gap-4">
                    <button
                        type="button"
                        className="h-4 w-4 bg-gray-500"
                        onClick={() => setIsEditingName(true)} />
                    <button
                        type="button"
                        className="h-4 w-4 bg-red-600"
                        onClick={handleDelete} />
                </div>
            </div>
            <div className="flex-1 min-h-24 w-full border">
            </div>
        </div>
    )
}
