export const ReminderContent = ({ item }) => {
    return (
        <span>{item.reminderTime ? new Date(item.reminderTime).toLocaleString() : 'No time set'}</span>
    )
}
