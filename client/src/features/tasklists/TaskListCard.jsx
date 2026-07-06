import { useState } from 'react'
import { updateTaskList, deleteTaskList, createTask } from '../../api'
import { useMutation } from '../../hooks'
import { EditableText, TextInput, List } from '../../components'
import { useTaskListsContext } from './TaskListsContext'
import { TaskCard } from './TaskCard'

export const TaskListCard = ({ taskList }) => {
    const [updatingTaskListNameField, setUpdatingTaskListNameField] = useState(false)
    const [creatingTaskField, setCreatingTaskField] = useState(false)

    // Prepare mutators and render handlers
    const { mutate: updateTaskListMutation, loading: updatingTaskList } = useMutation(updateTaskList)
    const { mutate: deleteTaskListMutation, loading: deletingTaskList } = useMutation(deleteTaskList)
    const { mutate: createTaskMutation, loading: creatingTask } = useMutation(createTask)

    const { handleTaskListUpdated, handleTaskListDeleted } = useTaskListsContext()

    // Click-once command
    const runDeleteTaskList = async () => {
        const deletedTaskList = await deleteTaskListMutation(taskList._id)
        if (!deletedTaskList) return

        handleTaskListDeleted(deletedTaskList)
    }

    // Field: rename task list
    const submitUpdateTaskListName = async (newName) => {
        if (!newName.trim()) {
            setUpdatingTaskListNameField(false)
            return false
        }

        const updatedTaskList = await updateTaskListMutation(taskList._id, newName)
        if (!updatedTaskList) return false

        handleTaskListUpdated(updatedTaskList)
        setUpdatingTaskListNameField(false)
        return true
    }

    const cancelUpdateTaskListName = () => setUpdatingTaskListNameField(false)

    // Field: create task
    const submitCreateTask = async (name) => {
        if (!name.trim()) {
            setCreatingTaskField(false)
            return false
        }

        const updatedTaskList = await createTaskMutation(taskList._id, name)
        if (!updatedTaskList) return false

        handleTaskListUpdated(updatedTaskList)
        setCreatingTaskField(false)
        return true
    }

    const cancelCreateTask = () => setCreatingTaskField(false)

    return (
        <div className="flex flex-col w-full border p-4 gap-4">
            <div className="flex flex-row items-center justify-between shrink-0 px-4">
                <EditableText
                    value={taskList.name}
                    active={updatingTaskListNameField}
                    onSubmit={submitUpdateTaskListName}
                    onCancel={cancelUpdateTaskListName}
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
                        onClick={runDeleteTaskList}
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
                    {(task) => <TaskCard taskListId={taskList._id} task={task} />}
                </List>
                {creatingTaskField && (
                    <div className="h-12 w-full flex flex-row items-center justify-between px-4">
                        <TextInput
                            onSubmit={submitCreateTask}
                            onCancel={cancelCreateTask}
                            disabled={updatingTaskList || deletingTaskList || creatingTask}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
