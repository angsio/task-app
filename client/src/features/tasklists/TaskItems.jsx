import { List } from '../../components'
import { TaskCard } from './TaskCard'

export const TaskItems = ({ tasks }) => {
    return (
        <List
            items={tasks}
            fallback={<div className="w-full h-full flex items-center justify-center">No tasks.</div>}
            keyExtractor={(task) => task._id}
        >
            {(task) => <TaskCard task={task} />}
        </List>
    )
}
