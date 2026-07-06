import { useState } from 'react'
import { updateTaskList, deleteTaskList, createTask } from '../../api'
import { useSubmit } from '../../hooks'
import { EditableText, TextInput, List } from '../../components'
import { useTaskListsContext } from './TaskListsContext'
import { TaskCard } from './TaskCard'

export const TaskListCard = ({ taskList }) => {
    const [updatingTaskListNameField, setUpdatingTaskListNameField] = useState(false)
    const [creatingTaskField, setCreatingTaskField] = useState(false)

    // Prepare mutators and render handlers
    const { submit: submitUpdateTaskList, loading: updatingTaskList } = useSubmit(updateTaskList)
    const { submit: submitDeleteTaskList, loading: deletingTaskList } = useSubmit(deleteTaskList)
    const { submit: submitCreateTask, loading: creatingTask } = useSubmit(createTask)

    const { handleTaskListUpdated, handleTaskListDeleted } = useTaskListsContext()

    // Task List Delete Mutation
    const deleteTaskListMutation = async () => {
        const deleted = await submitDeleteTaskList(taskList._id)
        if (!deleted) return false

        handleTaskListDeleted(deleted)
        return true
    }

    // Text Primitive Handling
    const updateTaskListNameSubmit = async (newName) => {
        if (!newName.trim()) {
            setUpdatingTaskListNameField(false)
            return false
        }
        
        const updatedTaskList = await submitUpdateTaskList(taskList._id, newName)
        if (!updatedTaskList) return false

        handleTaskListUpdated(updated)
        setUpdatingTaskListNameField(false)
        return true
    }

    const updateTaskListNameCancel = () => setUpdatingTaskListName(false)

    const createTaskSubmit = async (name) => {
        if (!name.trim()) {
            setCreatingTaskField(false)
            return false
        }

        const updatedTaskList = await submitCreateTask(taskList._id, name)
        if (!updatedTaskList) return false
        handleTaskListUpdated(updatedTaskList)

        setCreatingTaskField(false)
        return true
    }

    const createTaskCancel = () => setCreatingTaskField(false)

    return (
        <div className="flex flex-col w-full border p-4 gap-4">
            <div className="flex flex-row items-center justify-between shrink-0 px-4">
                <EditableText
                    value={taskList.name}
                    active={updatingTaskListNameField}
                    onSubmit={updateTaskListNameSubmit}
                    onCancel={updateTaskListNameCancel}
                    disabled={updatingTaskList || deletingTaskList || creatingTask}
                />
                <div className="flex flex-row items-center gap-4">
                    <button 
                        type="button" 
                        className="h-4 w-4 bg-green-400" 
                        onClick={() => setCreatingTaskField(true)} 
                    />
                    <button 
                        type="button"
                        className="h-4 w-4 bg-gray-500"
                        onClick={() => setUpdatingTaskListNameField(true)}
                    />
                    <button 
                        type="button" 
                        className="h-4 w-4 bg-red-600" 
                        onClick={deleteTaskListMutation}
                    />
                </div>
            </div>
            <div className="flex-1 min-h-24 w-full border p-4 flex flex-col gap-4">
                <List
                    items={taskList.tasks}
                    fallback={!creatingTaskField 
                        ? <div className="w-full h-full flex items-center justify-center">No tasks.</div>
                        : <></>}
                    keyExtractor={(task) => task._id}
                >
                    {(task) => <TaskCard task={task} />}
                </List>
                {creatingTaskField && (
                    <div className="h-12 w-full flex flex-row items-center justify-between px-4">
                        <TextInput
                            onSubmit={createTaskSubmit}
                            onCancel={createTaskCancel}
                            disabled={updatingTaskList || deletingTaskList || creatingTask}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
