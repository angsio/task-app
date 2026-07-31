import { Theme } from '../../models/index.js'

// (name: string, owner: string) -> Promise<ObjectId | null>
// Scoped to the owner, so a theme name only ever resolves within their board.
export const findThemeId = async (name, owner) => {
    const theme = await Theme.findOne({ name: new RegExp(`^${name}$`, 'i'), owner }).lean()
    return theme?._id ?? null
}