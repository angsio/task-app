import { Theme } from '../../models/index.js'

export const findThemeId = async (name) => {
    const theme = await Theme.findOne({ name: new RegExp(`^${name}$`, 'i') }).lean()
    return theme?._id ?? null
}
