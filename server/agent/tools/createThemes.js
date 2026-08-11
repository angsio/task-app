import { Theme } from '../../models/index.js'

import { findThemeIds } from './utilities.js'

// What the board gives a theme created from the UI, so one made here looks the
// same when the model names no colour.
const DEFAULT_COLOR = '#f22742'

export const createThemes = {
    name: 'create_themes',
    confirm: true,
    once: true,
    description: 'Create one or more new themes on the user\'s board. Themes are the categories that tasks, events and reminders are grouped under, such as "Work" or "Personal". Call this when the user asks for a new category or group to file things under, or when something they want scheduled belongs under a theme that does not exist yet. This creates the category only, never the items inside it. Several themes can be created in one call.',
    parameters: {
        type: 'object',
        properties: {
            themes: {
                type: 'array',
                minItems: 1,
                description: 'The list of themes to create. Provide at least one.',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'The name of the theme, such as "Work" or "Personal".' },
                        color: { type: 'string', description: 'Optional. A hex colour for the theme, such as "#3b82f6".' }
                    },
                    required: ['name']
                }
            }
        },
        required: ['themes']
    },
    summarise: ({ themes }) => themes.map(theme => `${theme.name}, a new theme`),
    run: async ({ themes } = {}, { owner }) => {
        const staged = []

        // Every name in the batch, checked against the board in one query.
        const taken = await findThemeIds(themes.map(theme => theme.name), owner)

        for (const theme of themes) {
            const name = theme.name?.trim()
            if (!name) return { reply: { error: 'Every theme needs a name.' } }
            if (taken.has(name.toLowerCase())) return { reply: { error: `A theme named "${name}" already exists.` } }

            const doc = new Theme({ name, color: theme.color ?? DEFAULT_COLOR, owner })
            try {
                await doc.validate()
            } catch (invalid) {
                return { reply: { error: `Could not create "${name}": ${invalid.message}` } }
            }

            // Staged names count as taken, so a batch cannot name one twice.
            taken.set(name.toLowerCase(), doc._id)
            staged.push(doc)
        }

        await Promise.all(staged.map(doc => doc.save()))

        return {
            reply: {
                created: staged.map(doc => ({ id: doc._id, name: doc.name })),
            },
            documents: staged,
        }
    },
}
