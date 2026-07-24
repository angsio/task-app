import { toHourMinute } from '../time'

const styles = {
    card:  'bg-slate-100',
    body:  'text-sm',
    label: 'font-bold',
    title: 'truncate leading-6',
}

export const ReminderCard = ({ item: reminder, color }) => {
    return (
        <div className={`relative h-full w-full flex flex-row ${styles.card}`}>
            <div
                className="absolute left-0 h-full w-2"
                style={{ backgroundColor: color }}
            />
            <div className={`h-full w-full flex flex-col pl-6 ${styles.body}`}>
                <div className={`shrink-0 ${styles.title}`}>
                    <span className={styles.label}>Reminder: </span>{reminder.title}
                </div>
                <div>
                    <span className={styles.label}>Time: </span>{toHourMinute(reminder.reminderTime)}
                </div>
            </div>
        </div>
    )
}