const MINUTES_IN_DAY = 24 * 60
const MOMENT_MINUTES = 30

const SPAN = {
    Task: item => item.hasDeadline ? { start: item.deadline, end: null } : null,
    Event: item => ({ start: item.timeStart, end: item.timeEnd }),
    Reminder: item => ({ start: item.reminderTime, end: null }),
}

const minutesInto = (date) => date.getHours() * 60 + date.getMinutes()

export const dayKey = (date) => date.toDateString()

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
            },
        }

        const key = dayKey(start)
        if (!byDay.has(key)) byDay.set(key, [])
        byDay.get(key).push(placed)
    }

    return byDay
}
