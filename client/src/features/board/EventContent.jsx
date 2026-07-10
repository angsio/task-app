export const EventContent = ({ item }) => {
    return (
        <div className="flex flex-col">
            <span>{new Date(item.timeStart).toLocaleString()}</span>
            <span>{new Date(item.timeEnd).toLocaleString()}</span>
        </div>
    )
}
