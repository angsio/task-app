import 'dotenv/config'
import mongoose from 'mongoose'

import { runBatch } from '../agent/runAgent.js'
import { TOOLS } from '../agent/tools/index.js'
import { ToolCall } from '../agent/ledger.js'
import { Theme, Item } from '../models/index.js'

/*
  Exercise the approved-batch path against a real replica set.

    node scripts/txcheck.js

  Connects to the same cluster as the app under a scratch database name, so the
  transaction behaviour is the real one and the real collections are untouched.
  Drops the scratch database on the way out.

  Covers what unit checks cannot: that a tool sees an earlier tool's uncommitted
  write, that a failed batch leaves nothing behind, that the ledger forgets the
  calls it rolled back, and that a tool which throws still unwinds.

  Exits non-zero if any check fails.
*/

const OWNER = 'txcheck-owner'
const DB = `${process.env.TXCHECK_DB ?? 'task-app-txcheck'}`

let failures = 0

// (name, args) -> a tool call shaped the way the model sends them
const call = (name, args) => ({
    id: `${name}-${Math.random().toString(36).slice(2)}`,
    function: { name, arguments: JSON.stringify(args) },
})

// () -> the minimum turn runBatch reads: where outcomes land, and the counters
// the metrics seams add to.
const newTurn = () => ({
    messages: [],
    documents: [],
    removed: [],
    offered: new Set(),
    context: { owner: OWNER, timeZone: 'America/Toronto' },
    trace: { runId: 'txcheck', ownerHash: null },
    toolMs: 0,
    called: [],
    embedTokens: 0,
})

// (turn) -> the reply each call wrote into the transcript, in order
const repliesOf = (turn) => turn.messages
    .filter(message => message.role === 'tool')
    .map(message => JSON.parse(message.content))

const check = (label, passed, detail = '') => {
    if (!passed) failures += 1
    console.log(`  ${passed ? 'pass' : 'FAIL'}  ${label}${detail ? `   ${detail}` : ''}`)
}

const counts = async () => ({
    themes: await Theme.countDocuments({ owner: OWNER }),
    items: await Item.countDocuments({ owner: OWNER }),
})

await mongoose.connect(process.env.MONGODB_URI, { dbName: DB })
console.log(`scratch database "${DB}" on the app's cluster\n`)

await Promise.all([
    Theme.deleteMany({ owner: OWNER }),
    Item.deleteMany({ owner: OWNER }),
    ToolCall.deleteMany({ owner: OWNER }),
])

// A theme and the items that belong in it, in one approved batch, with the
// items asked for first. Ordering has to reverse them, and create_items has to
// see a theme that is written but not yet committed.
console.log('one batch, items asked for before the theme they need')
{
    const turn = newTurn()
    const calls = [
        call('create_items', {
            items: [1, 2, 3, 4, 5].map(n => ({
                title: `Report ${n}`,
                itemType: 'Reminder',
                theme: 'Work',
                reminderTime: `2026-08-1${n}T18:00:00-04:00`,
            })),
        }),
        call('create_themes', { themes: [{ name: 'Work' }] }),
    ]

    await runBatch(turn, calls, -1, true)
    const { themes, items } = await counts()

    check('committed', themes === 1 && items === 5, `${themes} themes, ${items} items`)
    check('results kept the order the model asked in', repliesOf(turn)[0].created?.length === 5)
    check('client cache got the writes', turn.documents.length === 6)
    check('ledger recorded both calls', await ToolCall.countDocuments({ owner: OWNER }) === 2)
}

// The call that failed against the live database.
console.log('\ndelete_items, qualified by theme')
{
    const turn = newTurn()
    await runBatch(turn, [call('delete_items', {
        items: [{ title: 'Report 1', itemType: 'Reminder', theme: 'Work' }, { title: 'Report 2', theme: 'Work' }],
    })], -1, true)

    const { items } = await counts()
    check('two removed', items === 3, `${items} items left`)
    check('client cache got the removals', turn.removed.length === 2)
}

// A batch whose second call fails. The first genuinely writes, so this is the
// half-applied state the whole design exists to prevent.
console.log('\nsecond call fails, whole batch must unwind')
{
    const turn = newTurn()
    const calls = [
        call('create_themes', { themes: [{ name: 'Rollback' }] }),
        call('create_items', { items: [{ title: 'Orphan', itemType: 'Event', theme: 'Nonexistent', timeStart: '2026-08-11T09:00:00-04:00', timeEnd: '2026-08-11T10:00:00-04:00' }] }),
    ]

    await runBatch(turn, calls, -1, true)

    check('theme did not survive', await Theme.countDocuments({ owner: OWNER, name: 'Rollback' }) === 0)
    check('no documents sent to the client', turn.documents.length === 0)
    check('every call reported failure', repliesOf(turn).every(reply => reply.error))
    check('ledger forgot the rolled-back calls', await ToolCall.countDocuments({ owner: OWNER, callId: { $in: calls.map(c => c.id) } }) === 0)
}

// update_items moving an item into a theme created in the same transaction.
console.log('\nupdate_items into a theme from the same uncommitted batch')
{
    const turn = newTurn()
    await runBatch(turn, [
        call('update_items', { items: [{ title: 'Report 3', changes: { theme: 'Personal' } }] }),
        call('create_themes', { themes: [{ name: 'Personal' }] }),
    ], -1, true)

    const personal = await Theme.findOne({ owner: OWNER, name: 'Personal' })
    check('theme exists', Boolean(personal))
    check('item moved into it', await Item.countDocuments({ owner: OWNER, theme: personal?._id }) === 1)
}

// A tool that throws rather than reporting an error still has to unwind.
console.log('\na tool that throws mid-transaction')
{
    const { TOOLS } = await import('../agent/tools/index.js')
    const real = TOOLS.create_themes.run
    TOOLS.create_themes.run = async () => { throw new Error('boom') }

    const turn = newTurn()
    const calls = [call('create_themes', { themes: [{ name: 'Thrown' }] })]
    let threw = false

    try {
        await runBatch(turn, calls, -1, true)
    } catch {
        threw = true
    } finally {
        TOOLS.create_themes.run = real
    }

    check('error reached the caller', threw)
    check('nothing was written', await Theme.countDocuments({ owner: OWNER, name: 'Thrown' }) === 0)
    check('ledger forgot it', await ToolCall.countDocuments({ owner: OWNER, callId: calls[0].id }) === 0)
}

// Several items sharing a title, a type and a theme. Nothing but the id tells
// them apart, which is what a repeated meeting looks like.
console.log('\nitems that share a title')
{
    await runBatch(newTurn(), [call('create_items', {
        items: [12, 13, 14].map(d => ({
            title: 'Standup', itemType: 'Event', theme: 'Personal',
            timeStart: `2026-08-${d}T09:00:00-04:00`, timeEnd: `2026-08-${d}T09:15:00-04:00`,
        })),
    })], -1, true)

    const byTitle = newTurn()
    await runBatch(byTitle, [call('update_items', {
        items: [{ title: 'Standup', itemType: 'Event', theme: 'Personal', changes: { title: 'Sync' } }],
    })], -1, true)
    check('the title alone is refused', /matches 3 items/.test(repliesOf(byTitle)[0].error ?? ''))

    const listed = (await TOOLS.list_items.run({ itemType: 'Event' }, { owner: OWNER, timeZone: 'America/Toronto' })).reply
    check('list_items hands back ids', listed.every(item => item.id))

    const byId = newTurn()
    await runBatch(byId, [call('update_items', {
        items: listed.map(item => ({ id: String(item.id), title: item.title, changes: { title: 'Sync' } })),
    })], -1, true)
    check('all of them rename by id', await Item.countDocuments({ owner: OWNER, title: 'Sync' }) === 3)

    const bogus = newTurn()
    await runBatch(bogus, [call('delete_items', { items: [{ id: 'not-an-id', title: 'Sync' }] })], -1, true)
    check('a made-up id is an error, not a crash', /No item with id/.test(repliesOf(bogus)[0].error ?? ''))
}

// Deleting a theme takes its items with it.
console.log('\ndelete_themes cascades')
{
    const turn = newTurn()
    await runBatch(turn, [call('delete_themes', { names: ['Work'] })], -1, true)

    const { themes, items } = await counts()
    // Personal is left holding the item moved into it earlier plus the three
    // that share a title.
    check('the Work theme and its items are gone', themes === 1 && items === 4, `${themes} themes, ${items} items`)
    check('client cache got theme and items', turn.removed.length === 3, `${turn.removed.length} removed`)
}

// Dropping straight after a commit can lose a race with the transactions that
// just closed, which says nothing about the checks above.
try {
    await mongoose.connection.dropDatabase()
} catch {
    await new Promise(resolve => setTimeout(resolve, 500))
    await mongoose.connection.dropDatabase().catch(error => console.log(`  note: scratch database left behind (${error.codeName ?? error.message})`))
}

await mongoose.disconnect()

console.log(`\nscratch database dropped. ${failures ? `${failures} failed.` : 'all passed.'}`)
process.exit(failures ? 1 : 0)
