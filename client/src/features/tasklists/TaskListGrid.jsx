import { List } from '../../components'
import { TaskListCard } from './TaskListCard'

export const TaskListGrid = ({ taskLists, loading, error }) => {

    if (taskLists === null && loading) return <p>Loading...</p>
    if (taskLists === null && error) return <p>Error: {error.message}</p>

    return (
        <div className="grid grid-cols-4 gap-4 p-10 w-full">
            <List
                items={taskLists}
                fallback={<p className="col-span-full text-center">No task lists yet.</p>}
                keyExtractor={taskList => taskList._id}
            >
                {taskList => <TaskListCard taskList={taskList} />}
            </List>
        </div>
    )
}
