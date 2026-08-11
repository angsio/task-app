import { Item } from '../../models/index.js'

import { findItems, namedAs } from './utilities.js'

export const deleteItems = {
    name: 'delete_items',
    confirm: true,
    once: true,
    description: 'Remove tasks, events or reminders from the user\'s schedule. Call this to delete, cancel, drop or clear something that is already scheduled. Name each item by the title it is saved under, and give its type or its theme as well when more than one item could share that title. This never deletes a theme, only the items inside one. Several items can be removed in one call.',
    parameters: {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                minItems: 1,
                description: 'The list of items to delete. Provide at least one.',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'The title of the item, exactly as it is saved.' },
                        itemType: { type: 'string', enum: ['Task', 'Event', 'Reminder'], description: 'Optional. The kind of item, when the title alone could match more than one.' },
                        theme: { type: 'string', description: 'Optional. The name of the theme the item is under, when the title alone could match more than one.' }
                    },
                    required: ['title']
                }
            }
        },
        required: ['items']
    },
    summarise: ({ items }) => items.map(item => `Delete ${namedAs(item)}`),
    run: async ({ items } = {}, ctx) => {
        const staged = []

        // Every item named in the batch, resolved together.
        for (const found of await findItems(items, ctx)) {
            if (found.error) return { reply: { error: found.error } }

            staged.push(found.doc)
        }

        await Item.deleteMany({ owner: ctx.owner, _id: { $in: staged.map(doc => doc._id) } }, { session: ctx.session })

        return {
            reply: {
                deleted: staged.map(doc => ({ title: doc.title, type: doc.itemType })),
            },
            removed: staged,
        }
    },
}
