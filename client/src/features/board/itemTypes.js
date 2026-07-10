import { TaskAction } from './TaskAction'
import { EventFields } from './EventFields'
import { ReminderFields } from './ReminderFields'

export const ITEM_TYPES = {
    Task: {
        Action: TaskAction,
    },
    Event: {
        Fields: EventFields,
        defaults: () => {
            const start = new Date()
            const end = new Date(start.getTime() + 60 * 60 * 1000)
            return { timeStart: start.toISOString(), timeEnd: end.toISOString() }
        },
    },
    Reminder: {
        Fields: ReminderFields,
    },
}
