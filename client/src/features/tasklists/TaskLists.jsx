import { useFetch } from '../../hooks'
import { getTaskLists } from '../../api'
import { TaskUtilityBar } from './TaskUtilityBar'
import { TaskListGrid } from './TaskListGrid'
import { TaskListsProvider } from './TaskListsContext'

export const TaskLists = () => {
    const { data, setData, loading, error } = useFetch(getTaskLists)

    const handleTaskListCreated = (created) => {
        setData((current) => [...(current ?? []), created])
    }

    const handleTaskListUpdated = (updated) => {
        setData((current) => current.map(task => task._id === updated._id ? updated : task))
    }

    const handleTaskListDeleted = (id) => {
        setData(current => current.filter(task => task._id !== id))
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
