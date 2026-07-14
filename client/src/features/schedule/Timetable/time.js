const MINUTES_IN_DAY = 24 * 60
const MOMENT_MINUTES = 30

const ITEM_SPAN = {
    Task: item => ({ start: item.hasDeadline ? item.deadline : null, end: null }),
    Event: item => ({ start: item.timeStart, end: item.timeEnd }),
    Reminder: item => ({ start: item.reminderTime, end: null }),
}

export const itemSpan = (item) => {
    const span = ITEM_SPAN[item.itemType]?.(item)
    if (!span?.start) return null

    return {
        start: new Date(span.start),
        end: span.end ? new Date(span.end) : null,
    }
}

export const dayKey = (date) => date.toDateString()

export const groupByDay = (items) => {
    const byDay = new Map()

    for (const item of items) {
        const span = itemSpan(item)
        if (!span) continue

        const key = dayKey(span.start)
        if (!byDay.has(key)) byDay.set(key, [])
        byDay.get(key).push(item)
    }

    return byDay
}

const minutesIntoDay = (date) => date.getHours() * 60 + date.getMinutes()

export const dayPosition = (item) => {
    const { start, end } = itemSpan(item)

    const from = minutesIntoDay(start)
    const to = !end ? from + MOMENT_MINUTES
        : dayKey(end) === dayKey(start) ? minutesIntoDay(end)
        : MINUTES_IN_DAY

    const bottom = Math.min(to, MINUTES_IN_DAY)

    return {
        top: `${(from / MINUTES_IN_DAY) * 100}%`,
        height: `${((bottom - from) / MINUTES_IN_DAY) * 100}%`,
    }
}
