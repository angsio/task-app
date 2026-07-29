import { Task, Event, Reminder } from '../../models/index.js'

import { findThemeId } from './utilities.js'

const MODELS = { Task, Event, Reminder }

export const createItems = {
    name: 'create_items',
    confirm: true,
    description: 'Create one or more new items on the user\'s schedule — tasks, events, or reminders. Call this when the user asks to add, schedule, or create something. Several items can be created in a single call.',
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
    handler: async ({ items } = {}) => {
        const pending = []

        for (const item of items) {
            const Model = MODELS[item.itemType]
            if (!Model) return { result: { error: `Unknown item type: "${item.itemType}".` } }

            const themeId = await findThemeId(item.theme)
            if (!themeId) return { result: { error: `No theme named "${item.theme}" exists.` } }

            const doc = new Model({ ...item, theme: themeId })
            try {
                await doc.validate()
            } catch (invalid) {
                return { result: { error: `Could not create "${item.title}": ${invalid.message}` } }
            }

            pending.push({ doc, theme: item.theme })
        }

        await Promise.all(pending.map(({ doc }) => doc.save()))

        return {
            result: {
                created: pending.map(({ doc, theme }) => ({ id: doc._id, title: doc.title, type: doc.itemType, theme }))
            },
            documents: pending.map(({ doc }) => doc)
        }
    }
}