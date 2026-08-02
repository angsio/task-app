import { Theme } from '../../models/index.js'

const SERVER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

/*
  (text: string) -> string, safe to drop inside a RegExp literal.

  Theme names reach here from the model, which got them from whatever the user
  typed. Unescaped, "Work (Q3)" becomes /^Work (Q3)$/ where the brackets are a
  capture group, so the theme cannot be found by its own name, and "C++" throws
  a SyntaxError that surfaces as a 500 mid-conversation.
*/
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// (name: string) -> RegExp matching exactly that name, ignoring case
const exactly = (name) => new RegExp(`^${escapeRegex(name.trim())}$`, 'i')

/*
  Resolve many theme names at once.

  In:  names  string[], as the model wrote them. Duplicates and blanks are fine
       owner  string, the session's account
  Out: Promise<Map<string, ObjectId>>, keyed by lowercased name

  One query regardless of how many items are being created. The loop that
  preceded this ran a findOne per item, so a five-item batch under one theme
  cost five identical round trips.
*/
export const findThemeIds = async (names, owner) => {
    const wanted = [...new Set(names.map(name => name?.trim()).filter(Boolean))]
    if (!wanted.length) return new Map()

    const themes = await Theme.find({
        owner,
        name: { $in: wanted.map(exactly) },
    }).select('name').lean()

    return new Map(themes.map(theme => [theme.name.toLowerCase(), theme._id]))
}

// (name: string, owner: string) -> Promise<ObjectId | null>
// Scoped to the owner, so a theme name only ever resolves within their board.
export const findThemeId = async (name, owner) => {
    const theme = await Theme.findOne({ name: exactly(name), owner }).lean()
    return theme?._id ?? null
}

/*
  (zone: string | undefined) -> string, an IANA name like 'America/Toronto'

  The browser sends its own zone, so this falls back to the server's when it is
  missing or not a real one. It is user input on its way into Intl, which throws
  on anything it does not recognise.
*/
export const safeZone = (zone) => {
    if (!zone) return SERVER_ZONE

    try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone })
        return zone
    } catch {
        return SERVER_ZONE
    }
}

/*
  (value: string | Date | null, timeZone: string) -> string | null
  Reads like "Jul 30, 2026, 5:00 PM EDT".

  Every time the model is shown goes through here, so it reads back the user's
  own wall-clock time with the zone named, rather than a UTC stamp.
*/
export const inZone = (value, timeZone) => {
    if (!value) return null

    return new Date(value).toLocaleString('en-US', {
        timeZone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    })
}

// (date: Date, timeZone: string) -> string like "-04:00"
// The offset the model writes into an ISO time, so what it saves lands in the
// user's zone rather than the server's.
export const offsetIn = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date)
    const name = parts.find(part => part.type === 'timeZoneName')?.value ?? 'GMT'

    return name.replace('GMT', '') || '+00:00'
}
