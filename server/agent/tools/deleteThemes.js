import { Theme, Item } from '../../models/index.js'

import { findThemes } from './utilities.js'

export const deleteThemes = {
    name: 'delete_themes',
    confirm: true,
    once: true,
    description: 'Delete one or more whole themes from the user’s board, together with everything filed under them. Call this only when the user wants an entire category and all of its contents gone. This cannot be undone, so first list what is in that category and tell the user how many will go with it.',
    parameters: {
        type: 'object',
        properties: {
            names: {
                type: 'array',
                minItems: 1,
                description: 'The names of the themes to delete. Provide at least one.',
                items: { type: 'string', description: 'The name of a theme, such as "Work" or "Personal".' }
            }
        },
        required: ['names']
    },
    summarise: ({ names }) => names.map(name => `Delete the theme ${name}, and every item in it`),
    run: async ({ names } = {}, ctx) => {
        const staged = []

        // Every name in the batch, resolved against their board in one query.
        const themes = await findThemes(names, ctx)

        for (const name of names) {
            const theme = themes.get(name?.trim().toLowerCase())
            if (!theme) return { reply: { error: `No theme named "${name}" exists.` } }

            staged.push(theme)
        }

        const themeIds = staged.map(theme => theme._id)

        // Read before the delete, because the client needs the items it is about
        // to lose from its cache.
        const orphaned = await Item.find({ owner: ctx.owner, theme: { $in: themeIds } }).session(ctx.session).lean()

        await Theme.deleteMany({ owner: ctx.owner, _id: { $in: themeIds } }, { session: ctx.session })
        await Item.deleteMany({ owner: ctx.owner, theme: { $in: themeIds } }, { session: ctx.session })

        return {
            reply: {
                deleted: staged.map(theme => ({ name: theme.name })),
                itemsDeleted: orphaned.length,
            },
            removed: [...staged, ...orphaned],
        }
    },
}
