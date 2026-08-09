import 'dotenv/config'
import mongoose from 'mongoose'

import { Item, Theme } from '../models/index.js'
import { ToolCall } from '../agent/ledger.js'

/*
  Prints the indexes on items, themes and toolcalls, and with --drop removes the
  ones the schemas no longer declare.

    node scripts/indexes.js          just look
    node scripts/indexes.js --drop   look, then remove

  In:  --drop  actually remove them; without it nothing is changed
  Out: nothing, it logs what it found

  Mongoose adds indexes but never takes them away, so the single-field ones
  replaced by compounds are still sitting in Atlas costing a write per insert.
*/

// (model) -> Promise<string[]>, the names of that collection's indexes
const namesOn = async (model) => {
    const indexes = await model.collection.indexes()
    return indexes.map(index => index.name).sort()
}

// (model, name) -> Promise<void>, drops that index if it is still there
const drop = async (model, name) => {
    const names = await namesOn(model)
    if (!names.includes(name)) return

    await model.collection.dropIndex(name)
    console.log(`dropped ${model.collection.collectionName}.${name}`)
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'task-app' })

// Builds whatever the schemas declare, so the compounds are certainly there
// before anything they replaced is removed.
await Item.createIndexes()
await Theme.createIndexes()
await ToolCall.createIndexes()

console.log('items: ', await namesOn(Item))
console.log('themes:', await namesOn(Theme))
console.log('toolcalls:', await namesOn(ToolCall))

if (process.argv.includes('--drop')) {
    await drop(Item, 'owner_1')
    await drop(Item, 'theme_1')
    await drop(Theme, 'owner_1')

    console.log('items: ', await namesOn(Item))
    console.log('themes:', await namesOn(Theme))
}

await mongoose.disconnect()
