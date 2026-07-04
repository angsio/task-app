import { useState } from 'react'
import { useSubmit } from '../../hooks'
import { createTask } from '../../api'
import { EditableText } from '../../components'

export const TaskUtilityRow = ({ taskListId, onTaskCreated }) => {
    const [isAdding, setIsAdding] = useState(false)
    const { submit, loading, error } = useSubmit(createTask)

    const handleSubmit = async (name) => {
        if (!name.trim()) {
            setIsAdding(false)
            return
        }

        const updatedTaskList = await submit(taskListId, name)
        if (!updatedTaskList) return

        setIsAdding(false)
        onTaskCreated(updatedTaskList)
    }

    const handleCancel = () => setIsAdding(false)

    return (
        <div className="flex flex-row items-center gap-4">
            {isAdding && (
                <EditableText
                    value=""
                    active={true}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    disabled={loading}
                />
            )}
            <button
                type="button"
                className="h-4 w-4 bg-green-400"
                onClick={() => setIsAdding(true)}
            />
            {error && <p>{error.message}</p>}
        </div>
    )
}
