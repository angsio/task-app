import { Theme } from '../../models/index.js'

export const listThemes = {
    name: 'list_themes',
    description: 'List the themes on the user\'s schedule. Themes are the categories that items (tasks, events and reminders) are grouped under, such as "Work" or "Personal". Call this when the user asks which themes or categories exist, or to check that a theme really exists before putting an item in it.',
    parameters: {
        type: 'object',
        properties: {}
    },
    run: async (args, { owner }) => {
        const themes = await Theme.find({ owner }).lean()

        return { reply: themes.map(theme => ({ id: theme._id, name: theme.name })) }
    },
}