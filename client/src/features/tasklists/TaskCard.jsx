export const TaskCard = ({ task }) => {

    const handleToggleComplete = () => {

    }

    return (
        <div className="h-12 w-full flex flex-row items-center justify-between px-4">
            <span>{task.name}</span>
            <button
                type="button"
                className="h-4 w-4 bg-gray-300"
                onClick={handleToggleComplete}
            />
        </div>
    )
}
