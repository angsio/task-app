import { useFetch } from '../../hooks'
import { getTasks } from '../../api'
import { List } from '../../components'
import { TaskListCard } from './TaskListCard'

export const TaskListGrid = () => {
    const { data, loading, error } = useFetch(getTasks)

    if (loading) return <p>Loading...</p>
    if (error) return <p>Error: {error.message}</p>

    return (
        <div className="grid grid-cols-4 w-full">
            <List
                items={data}
                fallback={<p>No task lists yet.</p>}
                keyExtractor={(taskList) => taskList._id}
            >
                {(taskList) => <TaskListCard name={taskList.name} />}
            </List>
        </div>
    )
}
