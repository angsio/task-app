import { Theme } from '../../models/index.js'

export const listThemes = {
    name: 'list_themes',
    description: 'List the themes on the user\'s schedule. Themes are the categories that schedule items (tasks, events, and reminders) are grouped under, such as "Work" or "Personal". Call this when the user asks which themes or categories they have, or when you need a theme\'s id to reference it in another action.',
    parameters: {
        type: 'object',
        properties: {}
    },
    handler: async () => {
        const themes = await Theme.find({}).lean()

        return { result: themes.map(theme => ({ id: theme._id, name: theme.name })) }
    }
}