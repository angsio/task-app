import { findThemes, changesText } from './utilities.js'

// (changes: object) -> the same fields without the ones no update may touch.
// Ownership comes from the session, never the model, or a call could hand a
// theme to somebody else. A theme's id is fixed for its lifetime.
const withoutFixed = ({ owner, _id, ...fields }) => fields

// (doc, changes) -> string | null, the first field that is not on the theme.
// Mongoose drops an unknown path in silence, so without this the call would
// report a change it never made.
const foreignField = (doc, changes) => Object.keys(changes).find(field => !doc.schema.path(field)) ?? null

export const updateThemes = {
    name: 'update_themes',
    confirm: true,
    once: true,
    description: 'Change themes that already exist on the user\'s board. Call this to rename a theme, to recolour it, or to hide it from the board and show it again. Themes are the categories that tasks, events and reminders are grouped under, such as "Work" or "Personal". This changes the category itself, never the items inside it: to retime, rename or move an item, use the tool that updates items. Several themes can be changed in one call.',
    parameters: {
        type: 'object',
        properties: {
            themes: {
                type: 'array',
                minItems: 1,
                description: 'The list of themes to change. Provide at least one.',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'The name of the theme as it is saved now, used to find it.' },
                        changes: {
                            type: 'object',
                            description: 'The fields to set. Give only the ones that change; everything else is left alone.',
                            properties: {
                                name: { type: 'string', description: 'A new name for the theme.' },
                                color: { type: 'string', description: 'A hex colour for the theme, such as "#3b82f6".' },
                                visible: { type: 'boolean', description: 'Whether the theme is shown on the board.' }
                            }
                        }
                    },
                    required: ['name', 'changes']
                }
            }
        },
        required: ['themes']
    },
    summarise: ({ themes }) => themes.map(theme => `Change the theme ${theme.name}: ${changesText(theme.changes)}`),
    run: async ({ themes } = {}, ctx) => {
        const staged = []

        // The names being changed and the names being changed to, resolved in
        // one query, so a rename onto a name already in use is caught before
        // anything saves.
        const known = await findThemes(themes.flatMap(theme => [theme.name, theme.changes?.name]), ctx)

        for (const theme of themes) {
            const doc = known.get(theme.name?.trim().toLowerCase())
            if (!doc) return { reply: { error: `No theme named "${theme.name}" exists.` } }

            const changes = withoutFixed(theme.changes ?? {})

            if (!Object.keys(changes).length) return { reply: { error: `No changes were given for "${theme.name}".` } }

            const foreign = foreignField(doc, changes)
            if (foreign) return { reply: { error: `Could not change "${theme.name}": a theme has no ${foreign}.` } }

            const renamed = changes.name?.trim()

            if (renamed) {
                const clash = known.get(renamed.toLowerCase())
                if (clash && !clash._id.equals(doc._id)) return { reply: { error: `A theme named "${renamed}" already exists.` } }

                // The new name counts as in use, so a batch cannot rename two
                // themes to the same thing.
                known.set(renamed.toLowerCase(), doc)
                changes.name = renamed
            }

            doc.set(changes)
            try {
                await doc.validate()
            } catch (invalid) {
                return { reply: { error: `Could not change "${theme.name}": ${invalid.message}` } }
            }

            staged.push(doc)
        }

        await Promise.all(staged.map(doc => doc.save({ session: ctx.session })))

        return {
            reply: {
                updated: staged.map(doc => ({ id: doc._id, name: doc.name })),
            },
            documents: staged,
        }
    },
}
