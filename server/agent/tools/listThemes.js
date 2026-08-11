import { Theme } from '../../models/index.js'

export const listThemes = {
    name: 'list_themes',
    description: 'List the themes on the user’s board. Themes are the categories things get grouped under, such as "Work" or "Personal". Call this when the user asks which themes, categories or groups they have, and ALSO to look up whether a particular category already exists before filing anything under it. This only reads them.',
    parameters: {
        type: 'object',
        properties: {}
    },
    run: async (args, { owner, session }) => {
        const themes = await Theme.find({ owner }).session(session).lean()

        return { reply: themes.map(theme => ({ id: theme._id, name: theme.name })) }
    },
}