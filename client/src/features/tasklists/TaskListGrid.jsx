import { useOutletContext } from 'react-router-dom'
import { useFetch } from '../../hooks'
import { getTaskLists } from '../../api'
import { List } from '../../components'
import { TaskListCard } from './TaskListCard'

export const TaskListGrid = () => {
    const { taskListsVersion } = useOutletContext()
    const { data, loading, error } = useFetch(getTaskLists, [taskListsVersion])

    if (loading) return <p>Loading...</p>
    if (error) return <p>Error: {error.message}</p>

    return (
        <div className="grid grid-cols-4 w-full">
            <List
                items={data}
                fallback={<p className="col-span-full text-center py-12">No task lists yet.</p>}
                keyExtractor={(taskList) => taskList._id}
            >
                {(taskList) => <TaskListCard name={taskList.name} />}
            </List>
        </div>
    )
}
