import { Theme } from '../../models/index.js'

const SERVER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

/*
  (text: string) -> string with every regex-special character turned into a
  literal one, so the text matches itself when used as a pattern.

  Theme names arrive as the user typed them. Left alone, the brackets in
  "Work (Q3)" would be read as regex syntax rather than as brackets.
*/
const escapeRegexChars = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// (name: string) -> RegExp matching that whole name and nothing else, any case
const exactNameRegex = (name) => new RegExp(`^${escapeRegexChars(name.trim())}$`, 'i')

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
        name: { $in: wanted.map(exactNameRegex) },
    }).select('name').lean()

    return new Map(themes.map(theme => [theme.name.toLowerCase(), theme._id]))
}

// (name: string, owner: string) -> Promise<ObjectId | null>
// Scoped to the owner, so a theme name only ever resolves within their board.
export const findThemeId = async (name, owner) => {
    const theme = await Theme.findOne({ name: exactNameRegex(name), owner }).lean()
    return theme?._id ?? null
}

/*
  (zone: string | undefined) -> string, an IANA name like 'America/Toronto'

  The browser sends its own zone, so this falls back to the server's when it is
  missing or not a real one. It is user input on its way into Intl, which throws
  on anything it does not recognise.
*/
export const resolveTimeZone = (zone) => {
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
export const formatInZone = (value, timeZone) => {
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
export const utcOffsetIn = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date)
    const name = parts.find(part => part.type === 'timeZoneName')?.value ?? 'GMT'

    return name.replace('GMT', '') || '+00:00'
}
