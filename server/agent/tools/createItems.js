import { Task, Event, Reminder } from '../../models/index.js'

import { findThemeIds, formatInZone } from './utilities.js'

const MODELS = { Task, Event, Reminder }

// (item, timeZone: string) -> string, the item's timing in words, phrased per
// itemType, for the confirmation the user reads before approving the write.
const timingText = (item, timeZone) => {
    if (item.itemType === 'Event') {
        return `${formatInZone(item.timeStart, timeZone)} to ${formatInZone(item.timeEnd, timeZone)}`
    }

    if (item.itemType === 'Reminder') return formatInZone(item.reminderTime, timeZone)

    return item.deadline ? `due ${formatInZone(item.deadline, timeZone)}` : 'no deadline'
}

export const createItems = {
    name: 'create_items',
    confirm: true,
    once: true,
    description: 'Add one or more new items to the user\'s schedule, tasks, events or reminders. Call this to book, add, schedule or create something, once you already know the concrete times it needs. If the request is relative to something already on the schedule ("after my meeting", "same day as X"), read that item first and use its real times. Every item goes in a theme that already exists; if the theme is new, create it first with the theme tool and wait for that to finish. Several items can be created in one call.',
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
                        theme: { type: 'string', description: 'The name of the theme this item belongs to, such as "Work" or "Personal". The theme must already exist. If it does not, create it in an earlier turn and wait for that to succeed, or this whole call fails and nothing is saved.' },
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
    summarise: ({ items }, { timeZone }) => items.map(item => `${item.title}, ${item.itemType} in ${item.theme}, ${timingText(item, timeZone)}`),
    run: async ({ items } = {}, { owner }) => {
        const staged = []

        // Every theme named in the batch, resolved in one query.
        const themeIds = await findThemeIds(items.map(item => item.theme), owner)

        for (const item of items) {
            const Model = MODELS[item.itemType]
            if (!Model) return { reply: { error: `Unknown item type: "${item.itemType}".` } }

            const themeId = themeIds.get(item.theme?.trim().toLowerCase())
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