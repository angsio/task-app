import { useMutation } from '../../hooks'
import { createTaskList } from '../../api'

import { useTaskListsContext } from './TaskListsContext'
import { TextInput } from '../../components'

export const TaskUtilityBar = () => {

    const { mutate: createTaskListMutation, loading: creatingTaskList } = useMutation(createTaskList)
    const { handleTaskListCreated } = useTaskListsContext()

    const submitCreateTaskList = async (name) => {
        if (!name.trim()) return false

        const created = await createTaskListMutation(name)
        if (!created) return false

        handleTaskListCreated(created)
        return true
    }

    return (
        <div className="sticky top-0 z-10 h-1/20 w-full bg-rose-800 flex flex-row items-center px-10">
            <TextInput
                onSubmit={submitCreateTaskList}
                disabled={creatingTaskList}
                placeholder="New Task List"
                clearOnSubmit
                submitLabel="Add"
            />
        </div>
    )
}
