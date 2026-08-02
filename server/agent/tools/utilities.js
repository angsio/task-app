import { Theme } from '../../models/index.js'

const SERVER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

// (name: string, owner: string) -> Promise<ObjectId | null>
// Scoped to the owner, so a theme name only ever resolves within their board.
export const findThemeId = async (name, owner) => {
    const theme = await Theme.findOne({ name: new RegExp(`^${name}$`, 'i'), owner }).lean()
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
