import { useFetch } from '../../hooks'
import { getTaskLists } from '../../api'
import { TaskUtilityBar } from './TaskUtilityBar'
import { TaskListGrid } from './TaskListGrid'
import { TaskListsProvider } from './TaskListsContext'

export const TaskLists = () => {
    const { data, setData, loading, error } = useFetch(getTaskLists)

    const handleTaskListCreated = (created) => {
        setData(current => [...(current ?? []), created])
    }

    const handleTaskListUpdated = (updated) => {
        setData(current => current.map(taskList => taskList._id === updated._id ? updated : taskList))
    }

    const handleTaskListDeleted = (deleted) => {
        setData(current => current.filter(task => task._id !== deleted._id))
    }

    return (
        <TaskListsProvider value={{ 
            handleTaskListCreated, 
            handleTaskListUpdated, 
            handleTaskListDeleted
        }}>
            <TaskUtilityBar />
            <TaskListGrid taskLists={data} loading={loading} error={error} />
        </TaskListsProvider>
    )
}
