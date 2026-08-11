import { isValidObjectId } from 'mongoose'

import { Theme, Item } from '../../models/index.js'

const SERVER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

// (text: string) -> the same text with every regex-special character escaped,
// so a name like "Work (Q3)" matches itself rather than reading as a pattern.
const escapeRegexChars = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// (name: string) -> RegExp matching that whole name and nothing else, any case
export const exactNameRegex = (name) => new RegExp(`^${escapeRegexChars(name.trim())}$`, 'i')

/*
  Resolve many theme names at once, in one query.

  In:  names  string[], as the model wrote them. Duplicates and blanks are fine
       ctx    the tool context, { owner, session }
  Out: Promise<Map<string, theme>>, keyed by lowercased name
*/
export const findThemes = async (names, { owner, session }) => {
    const wanted = [...new Set(names.map(name => name?.trim()).filter(Boolean))]
    if (!wanted.length) return new Map()

    const themes = await Theme.find({ owner, name: { $in: wanted.map(exactNameRegex) } }).session(session)

    return new Map(themes.map(theme => [theme.name.toLowerCase(), theme]))
}

// (names: string[], ctx) -> Promise<Map<string, ObjectId>>, keyed by lowercased name
export const findThemeIds = async (names, ctx) => {
    const themes = await findThemes(names, ctx)

    return new Map([...themes].map(([name, theme]) => [name, theme._id]))
}

// (name: string, ctx) -> Promise<ObjectId | null>
// Scoped to the owner, so a name only ever resolves within their board.
export const findThemeId = async (name, { owner, session }) => {
    const theme = await Theme.findOne({ name: exactNameRegex(name), owner }).session(session).lean()

    return theme?._id ?? null
}

/*
  Resolve many item locators at once, for the tools that change or remove
  something already on the schedule.

  In:  locators  { title, id?, itemType?, theme? }[], as the model wrote them.
                 An id settles it outright; without one the title has to be
                 unique once type and theme have narrowed it
       ctx       the tool context, { owner, session }
  Out: Promise<({ doc } | { error })[]>, one entry per locator, in order.
       An entry is an error when the theme does not exist, when nothing is
       called that, or when the title still matches more than one item

  Two queries however long the batch is. Every item comes back scoped to the
  owner, so neither a title nor an id resolves outside their own schedule.
*/
export const findItems = async (locators, ctx) => {
    const titles = [...new Set(locators.map(locator => locator.title?.trim()).filter(Boolean))]
    const ids = [...new Set(locators.map(locator => locator.id).filter(isValidObjectId))]

    const wanted = []
    if (titles.length) wanted.push({ title: { $in: titles.map(exactNameRegex) } })
    if (ids.length) wanted.push({ _id: { $in: ids } })

    const themes = await findThemes(locators.map(locator => locator.theme), ctx)
    const found = wanted.length
        ? await Item.find({ owner: ctx.owner, $or: wanted }).session(ctx.session)
        : []

    // Grouped in one pass, rather than filtering the whole list once per locator.
    const byId = new Map(found.map(item => [String(item._id), item]))
    const byTitle = new Map()
    for (const item of found) {
        const group = byTitle.get(item.title.toLowerCase())

        if (group) group.push(item)
        else byTitle.set(item.title.toLowerCase(), [item])
    }

    return locators.map(({ id, title, itemType, theme }) => {
        if (id) {
            const doc = byId.get(String(id))

            return doc ? { doc } : { error: `No item with id ${id} is on the schedule.` }
        }

        if (!title?.trim()) return { error: 'Every item has to be named by its title or its id.' }

        const themeId = theme && themes.get(theme.trim().toLowerCase())?._id
        if (theme && !themeId) return { error: `No theme named "${theme}" exists.` }

        const matches = (byTitle.get(title.trim().toLowerCase()) ?? []).filter(item => (
            (!itemType || item.itemType === itemType) && (!themeId || item.theme.equals(themeId))
        ))

        if (!matches.length) return { error: `Nothing on the schedule is called "${title}".` }
        if (matches.length > 1) {
            return { error: `"${title}" matches ${matches.length} items that are alike in type and theme, so naming those cannot narrow it. List the items, then give the id of the one you mean, or one entry per id if you mean all of them.` }
        }

        return { doc: matches[0] }
    })
}

// (locator: { title, itemType?, theme? }) -> string, the item as the model named it
export const namedAs = ({ title, itemType, theme }) => {
    const qualifiers = [itemType, theme && `in ${theme}`].filter(Boolean)

    return qualifiers.length ? `${title} (${qualifiers.join(' ')})` : title
}

// (zone: string | undefined) -> string, an IANA name like 'America/Toronto'
// Falls back to the server's zone when the browser sends none, or sends one
// Intl does not recognise.
export const resolveTimeZone = (zone) => {
    if (!zone) return SERVER_ZONE

    try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone })
        return zone
    } catch {
        return SERVER_ZONE
    }
}

// (value: string | Date | null, timeZone: string) -> string | null
// Reads like "Tue, Jul 30, 2026, 5:00 PM EDT". The weekday is named because the
// model cannot reliably work one out from a date, and asks like "every weekday
// until Friday" turn on it.
export const formatInZone = (value, timeZone) => {
    if (!value) return null

    return new Date(value).toLocaleString('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    })
}

const TIME_FIELDS = new Set(['deadline', 'timeStart', 'timeEnd', 'reminderTime'])

// (changes: object, timeZone: string) -> string, the fields an update would set,
// times in words. Reads like "title to Gym, timeStart to Jul 30, 2026, 5:00 PM EDT".
export const changesText = (changes = {}, timeZone) => Object.entries(changes)
    .map(([field, value]) => `${field} to ${TIME_FIELDS.has(field) ? formatInZone(value, timeZone) : value}`)
    .join(', ')

const REQUIRED_BY_TYPE = { Event: ['timeStart', 'timeEnd'], Reminder: ['reminderTime'] }

/*
  (fields, where: string) -> string | null, what is wrong with an item's timing.

  A tool spec cannot say "reminderTime is required, but only when itemType is
  Reminder", so the fields each kind needs are checked here instead. Without
  this a Reminder with no time passes its spec, and the user is shown a
  confirmation with "null" where the time should be.
*/
export const timingProblem = (fields, where) => {
    const missing = (REQUIRED_BY_TYPE[fields.itemType] ?? []).find(field => !fields[field])
    if (missing) return `${where}.${missing} is required for ${fields.itemType} items and was missing`

    if (fields.hasDeadline && !fields.deadline) return `${where}.deadline is required when hasDeadline is true`

    const unreadable = [...TIME_FIELDS].find(field => fields[field] && Number.isNaN(Date.parse(fields[field])))
    if (unreadable) return `${where}.${unreadable} is not a date that can be read`

    return null
}

// (date: Date, timeZone: string) -> string like "-04:00"
export const utcOffsetIn = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date)
    const name = parts.find(part => part.type === 'timeZoneName')?.value ?? 'GMT'

    return name.replace('GMT', '') || '+00:00'
}
