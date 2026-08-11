import { findItems, findThemeIds, namedAs, changesText, timingProblem } from './utilities.js'

// (changes: object) -> the same fields without the ones no update may touch.
// Ownership comes from the session, never the model, or a call could hand an
// item to somebody else. An item's id and kind are fixed for its lifetime.
const withoutFixed = ({ owner, _id, itemType, ...fields }) => fields

// (doc, changes) -> string | null, the first field that is not on this item's
// kind. A Task has no timeStart, and mongoose drops an unknown path in silence,
// so without this the call would report a change it never made.
const foreignField = (doc, changes) => Object.keys(changes).find(field => !doc.schema.path(field)) ?? null

export const updateItems = {
    name: 'update_items',
    confirm: true,
    once: true,
    description: 'Change tasks, events or reminders that are already on the user’s schedule. Call this to reschedule, retime, postpone or rename one, to mark a task done, or to move an item out of one theme and refile it under another. Name each item by the title it is saved under, and give its type or its theme as well when more than one item could share that title. An item cannot change kind: to turn a task into an event, delete it and create the event. Several items can be changed in one call.',
    parameters: {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                minItems: 1,
                description: 'The list of items to change. Provide at least one.',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'The title of the item as it is saved now, used to find it and to describe the change to the user.' },
                        id: { type: 'string', description: 'Optional. The item\'s id from list_items. Give this when several items share a title, such as a meeting repeated on four days; it settles which one outright. To change all of them, send one entry per id.' },
                        itemType: { type: 'string', enum: ['Task', 'Event', 'Reminder'], description: 'Optional. The kind of item, when the title alone could match more than one.' },
                        theme: { type: 'string', description: 'Optional. The name of the theme the item is under now, when the title alone could match more than one.' },
                        changes: {
                            type: 'object',
                            description: 'The fields to set. Give only the ones that change; everything else is left alone.',
                            properties: {
                                title: { type: 'string', description: 'A new title for the item.' },
                                theme: { type: 'string', description: 'The name of the theme to move the item to. It must already exist; if it does not, create it in an earlier turn and wait for that to succeed.' },
                                completed: { type: 'boolean', description: 'For Tasks only. Whether the task is done.' },
                                hasDeadline: { type: 'boolean', description: 'For Tasks only. Whether the task has a deadline at all.' },
                                deadline: { type: 'string', description: 'For Tasks only. ISO 8601 datetime the task is due.' },
                                timeStart: { type: 'string', description: 'For Events only. ISO 8601 datetime the event starts.' },
                                timeEnd: { type: 'string', description: 'For Events only. ISO 8601 datetime the event ends.' },
                                reminderTime: { type: 'string', description: 'For Reminders only. ISO 8601 datetime for the reminder.' }
                            }
                        }
                    },
                    required: ['title', 'changes']
                }
            }
        },
        required: ['items']
    },
    check: ({ items }) => items.map((item, index) => timingProblem(item.changes ?? {}, `items[${index}].changes`)).find(Boolean) ?? null,
    summarise: ({ items }, { timeZone }) => items.map(item => `Change ${namedAs(item)}: ${changesText(item.changes, timeZone)}`),
    run: async ({ items } = {}, ctx) => {
        const staged = []

        // Every item named in the batch, and every theme they are being moved
        // to, each resolved in one lookup rather than one per item.
        const found = await findItems(items, ctx)
        const themeIds = await findThemeIds(items.map(item => item.changes?.theme), ctx)

        for (const [index, item] of items.entries()) {
            if (found[index].error) return { reply: { error: found[index].error } }

            const doc = found[index].doc
            const changes = withoutFixed(item.changes ?? {})

            if (!Object.keys(changes).length) return { reply: { error: `No changes were given for "${item.title}".` } }

            const foreign = foreignField(doc, changes)
            if (foreign) return { reply: { error: `Could not change "${item.title}": a ${doc.itemType} has no ${foreign}.` } }

            if (changes.theme) {
                const themeId = themeIds.get(changes.theme.trim().toLowerCase())
                if (!themeId) return { reply: { error: `No theme named "${changes.theme}" exists.` } }

                changes.theme = themeId
            }

            doc.set(changes)
            try {
                await doc.validate()
            } catch (invalid) {
                return { reply: { error: `Could not change "${item.title}": ${invalid.message}` } }
            }

            staged.push(doc)
        }

        for (const doc of staged) await doc.save({ session: ctx.session })

        return {
            reply: {
                updated: staged.map(doc => ({ id: doc._id, title: doc.title, type: doc.itemType })),
            },
            documents: staged,
        }
    },
}
