import { Task, Event, Reminder } from '../../models/index.js'

import { findThemeId, inZone } from './utilities.js'

const MODELS = { Task, Event, Reminder }

// (item, timeZone: string) -> string, when this item lands, phrased per itemType.
// The user is approving a write, so the summary must show WHEN, in their own
// clock. A title and a theme alone give them nothing to check against.
const when = (item, timeZone) => {
    const at = (value) => inZone(value, timeZone)

    if (item.itemType === 'Event') return `${at(item.timeStart)} to ${at(item.timeEnd)}`
    if (item.itemType === 'Reminder') return at(item.reminderTime)

    return item.deadline ? `due ${at(item.deadline)}` : 'no deadline'
}

export const createItems = {
    name: 'create_items',
    confirm: true,
    description: 'Add one or more new items to the user\'s schedule, tasks, events or reminders. Call this to book, add, schedule or create something, once you already know the concrete times it needs. If the request is relative to something already on the schedule ("after my meeting", "same day as X"), read that item first and use its real times. Several items can be created in one call.',
    parameters: {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                minItems: 1,
                description: 'The list of items to create. Provide at least one.',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'The name of the item.' },
                        itemType: { type: 'string', enum: ['Task', 'Event', 'Reminder'], description: 'The kind of item to create.' },
                        theme: { type: 'string', description: 'The name of the theme this item belongs to, such as "Work" or "Personal".' },
                        hasDeadline: {type: 'boolean', description: 'For Tasks only. This dictates whether a task has a deadline or not.'},
                        deadline: { type: 'string', description: 'For Tasks only. Only needed if the task has a deadline. ISO 8601 datetime the task is due.' },
                        timeStart: { type: 'string', description: 'For Events only. ISO 8601 datetime the event starts.' },
                        timeEnd: { type: 'string', description: 'For Events only. ISO 8601 datetime the event ends.' },
                        reminderTime: { type: 'string', description: 'For Reminders only. ISO 8601 datetime for the reminder.' }
                    },
                    required: ['title', 'itemType', 'theme']
                }
            }
        },
        required: ['items']
    },
    summarise: ({ items }, { timeZone }) => items.map(item => `${item.title}, ${item.itemType} in ${item.theme}, ${when(item, timeZone)}`),
    run: async ({ items } = {}, { owner }) => {
        const staged = []

        for (const item of items) {
            const Model = MODELS[item.itemType]
            if (!Model) return { reply: { error: `Unknown item type: "${item.itemType}".` } }

            const themeId = await findThemeId(item.theme, owner)
            if (!themeId) return { reply: { error: `No theme named "${item.theme}" exists.` } }

            const doc = new Model({ ...item, theme: themeId, owner })
            try {
                await doc.validate()
            } catch (invalid) {
                return { reply: { error: `Could not create "${item.title}": ${invalid.message}` } }
            }

            staged.push({ doc, theme: item.theme })
        }

        await Promise.all(staged.map(({ doc }) => doc.save()))

        return {
            reply: {
                created: staged.map(({ doc, theme }) => ({ id: doc._id, title: doc.title, type: doc.itemType, theme })),
            },
            documents: staged.map(({ doc }) => doc),
        }
    },
}