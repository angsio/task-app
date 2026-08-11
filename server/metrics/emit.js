import { createWriteStream, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomUUID } from 'node:crypto'

export const SCHEMA_VERSION = 1

const DIR = process.env.METRICS_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'data')
const RETAIN_DAYS = Number(process.env.METRICS_RETAIN_DAYS ?? 30)
const SALT = process.env.METRICS_SALT ?? ''
const ENV = process.env.NODE_ENV ?? 'development'
const ENABLED = process.env.METRICS_ENABLED !== '0'

// The only switch that lets user or model text reach disk.
export const LOG_CONTENT = process.env.METRICS_LOG_CONTENT === '1'

const DAY_FILE = /^\d{4}-\d{2}-\d{2}\.jsonl$/

let stream = null
let openDay = null
let broken = false

const dayOf = (date) => date.toISOString().slice(0, 10)

// (error) -> void, stops the sink for the life of the process.
const disable = (error) => {
    broken = true
    stream = null
    console.error('Metrics disabled after a write failure:', error?.message ?? error)
}

// (day) -> void, deletes whole days past the retention window.
const prune = (day) => {
    const cutoff = new Date(`${day}T00:00:00Z`)
    cutoff.setUTCDate(cutoff.getUTCDate() - RETAIN_DAYS)
    const oldest = dayOf(cutoff)

    for (const name of readdirSync(DIR)) {
        if (DAY_FILE.test(name) && name.slice(0, 10) < oldest) unlinkSync(join(DIR, name))
    }
}

// (day) -> the append stream for that day, reopened when the day rolls over.
const streamFor = (day) => {
    if (stream && openDay === day) return stream

    stream?.end()
    mkdirSync(DIR, { recursive: true })

    stream = createWriteStream(join(DIR, `${day}.jsonl`), { flags: 'a' })
    stream.on('error', disable)
    openDay = day

    // A file that will not delete is not a reason to stop recording.
    try {
        prune(day)
    } catch (error) {
        console.error('Metrics could not prune old files:', error?.message ?? error)
    }

    return stream
}

/*
  Write one event. The only function in the subsystem that touches disk.

  In:  event   string, the event name
       fields  object, everything specific to it; must carry runId

  Out: void. Never throws, never awaits, never blocks the caller.
*/
export const emit = (event, fields = {}) => {
    if (!ENABLED || broken) return

    try {
        const now = new Date()
        const record = { v: SCHEMA_VERSION, ts: now.toISOString(), kind: 'runtime', event, env: ENV, ...fields }

        streamFor(dayOf(now)).write(`${JSON.stringify(record)}\n`)
    } catch (error) {
        disable(error)
    }
}

// () -> string, groups every event from one turn or one eval sweep.
export const newRunId = () => randomUUID()

// (owner) -> string, twelve hex characters. Salted, because account ids are
// short enough to be recovered from an unsalted hash.
export const hashOwner = (owner) => (owner
    ? createHash('sha256').update(`${SALT}:${owner}`).digest('hex').slice(0, 12)
    : null)

// (error) -> string | null, the errno from anywhere in the cause chain.
// Bounded, because a cause chain is not guaranteed acyclic.
const errnoOf = (error) => {
    let node = error

    for (let depth = 0; node && depth < 4; depth++) {
        if (typeof node.code === 'string' && node.code.startsWith('E')) return node.code
        node = node.cause
    }

    return null
}

/*
  (error) -> string, a short cause code such as net_ECONNREFUSED or upstream_429.

  Codes, never messages: a validation message repeats the value that failed,
  which is user content.
*/
export const causeOf = (error) => {
    if (!error) return 'unknown'

    const errno = errnoOf(error)
    if (errno) return `net_${errno}`

    if (error.upstreamStatus !== undefined) return `upstream_${error.upstreamStatus}`
    if (typeof error.statusCode === 'number') return `upstream_${error.statusCode}`
    if (error.name === 'ValidationError') return 'validation'
    if (error.name === 'CastError') return 'cast'
    if (error.code !== undefined) return `code_${error.code}`

    return error.name || 'unknown'
}

// (value) -> number, serialised size, or 0 if it will not serialise.
export const bytesOf = (value) => {
    try {
        return JSON.stringify(value ?? null).length
    } catch {
        return 0
    }
}
