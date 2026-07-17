import { Item, Theme } from '../../models/index.js'

const shapeItem = (item) => {
    const base = { title: item.title, type: item.itemType, theme: item.theme?.name ?? null }

    if (item.itemType === 'Task') return { ...base, completed: item.completed, deadline: item.deadline }
    if (item.itemType === 'Event') return { ...base, start: item.timeStart, end: item.timeEnd }
    if (item.itemType === 'Reminder') return { ...base, at: item.reminderTime }

    return base
}

export const listItems = {
    name: 'list_items',
    description: 'List the items on the user\'s schedule, including their tasks, events, and reminders. Call this whenever the user asks what is on their schedule, what they have coming up, or what is due.',
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
    handler: async ({ itemType, theme } = {}) => {
        const filter = {}
        if (itemType) filter.itemType = itemType

        if (theme) {
            const match = await Theme.findOne({ name: new RegExp(`^${theme}$`, 'i') }).lean()
            if (!match) return { error: `No theme named "${theme}" exists.` }
            filter.theme = match._id
        }

        const items = await Item.find(filter).populate('theme', 'name').lean()

        return items.map(shapeItem)
    }
}
