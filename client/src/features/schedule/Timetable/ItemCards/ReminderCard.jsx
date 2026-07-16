import { toHourMinute } from '../time'

export const ReminderCard = ({ item: reminder, color }) => {
    return (
        <div className="h-full w-full relative flex flex-row bg-slate-100">
            <div
                className="absolute left-0 h-full w-2 hover:w-4 transition-[width] duration-200 ease-out"
                style={{ backgroundColor: color }}
            />
            <div className="h-full w-full flex flex-col pl-6">
                <div className="text-sm truncate shrink-0 leading-6">
                    <span className="font-bold">Reminder: </span>{reminder.title}
                </div>
                <div className="text-sm">
                    <span className="font-bold">Time: </span>{toHourMinute(reminder.reminderTime)}
                </div>
            </div>
        </div>
    )
}