const MINUTES_IN_DAY = 24 * 60
const MOMENT_MINUTES = 30

const SPAN = {
    Task: item => item.hasDeadline ? { start: item.deadline, end: null } : null,
    Event: item => ({ start: item.timeStart, end: item.timeEnd }),
    Reminder: item => ({ start: item.reminderTime, end: null }),
}

// (value: string | Date) -> string, 'HH:mm' in local time
export const toHourMinute = (value) => {
    const date = new Date(value)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
}

// (date: Date) -> number, minutes elapsed since local midnight
const minutesInto = (date) => date.getHours() * 60 + date.getMinutes()

// (date: Date) -> string, a stable per-day key for grouping
export const dayKey = (date) => date.toDateString()

// () -> Date[], the seven days of the current week starting Monday at 00:00
export const weekDays = () => {
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, offset) => {
        const day = new Date(monday)
        day.setDate(monday.getDate() + offset)
        return day
    })
}

/*
  Place items on the timetable grid.

  In:  items  item[] of any itemType
  Out: Map<dayKey, placed[]>, each placed { item, style: { top, height } }
       as CSS percentages of a full day.

  An item with no time for its type is skipped. One with no end (a task or
  reminder) is given a fixed slice so it stays visible, and one running past
  midnight is clipped to its own day.
*/
export const layoutByDay = (items) => {
    const byDay = new Map()

    for (const item of items) {
        const span = SPAN[item.itemType](item)
        if (!span) continue

        const start = new Date(span.start)
        const end = span.end && new Date(span.end)

        const from = minutesInto(start)
        const to = !end 
            ? 
                Math.min(from + MOMENT_MINUTES, MINUTES_IN_DAY)
            : 
                (dayKey(end) === dayKey(start) ? minutesInto(end) : MINUTES_IN_DAY)

        const placed = {
            item,
            style: {
                top: `${(from / MINUTES_IN_DAY) * 100}%`,
                height: `${((to - from) / MINUTES_IN_DAY) * 100}%`,
            }
        }

        const key = dayKey(start)
        if (!byDay.has(key)) byDay.set(key, [])
        byDay.get(key).push(placed)
    }

    return byDay
}