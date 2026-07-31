import { Item } from '../../models/index.js'

import { findThemeId } from './utilities.js'

const shapeItem = (item) => {
    const base = { title: item.title, type: item.itemType, theme: item.theme?.name ?? null }

    if (item.itemType === 'Task') return { ...base, completed: item.completed, deadline: item.deadline }
    if (item.itemType === 'Event') return { ...base, start: item.timeStart, end: item.timeEnd }
    if (item.itemType === 'Reminder') return { ...base, at: item.reminderTime }

    return base
}

export const listItems = {
    name: 'list_items',
    description: 'Read what is already on the user\'s schedule: their tasks, events and reminders, with the real start, end, deadline and reminder times. Call this whenever the user asks what they have on, what is coming up or what is due, and ALSO whenever you need to check the schedule before acting, to find when an existing item is, to place something before or after it, to look for a free slot, or to check for a clash. Can be filtered to one type or one theme.',
    parameters: {
        type: 'object',
        properties: {
            itemType: {
                type: 'string',
                enum: ['Task', 'Event', 'Reminder'],
                description: 'Optional. Return only items of this type. Omit to return everything.'
            },
            theme: {
                type: 'string',
                description: 'Optional. The name of a theme to filter by, such as "Work" or "Personal". Only return items grouped under that theme.'
            }
        },
        required: []
    },
    run: async ({ itemType, theme } = {}, { owner }) => {
        const filter = { owner }
        if (itemType) filter.itemType = itemType

        if (theme) {
            const themeId = await findThemeId(theme, owner)
            if (!themeId) return { reply: { error: `No theme named "${theme}" exists.` } }
            filter.theme = themeId
        }

        const items = await Item.find(filter).populate('theme', 'name').lean()

        return { reply: items.map(shapeItem) }
    },
}