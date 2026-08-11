import 'dotenv/config'

import { embed } from './useBedrock.js'
import { upsertTool } from './useSupabase.js'
import { RETRIEVABLE } from './tools/index.js'

/*
  Embed every retrievable tool's description and write it to the index.

    node agent/seedTools.js

  Run after adding, renaming or rewording a tool. Keyed on name, so re-running
  is safe. A tool removed from the code is NOT removed here; delete its row.

  Exits non-zero if any tool failed.
*/

// (tool) -> Promise<void>, embeds the description and writes one index row
const seed = async (tool) => {
    const embedding = await embed(tool.description)
    await upsertTool(tool.name, tool.description, embedding)
}

// (error) -> string, the message with the underlying fault appended
const detail = (error) => {
    const cause = error?.cause
    if (!cause) return error?.message ?? String(error)

    const code = cause.code ? ` [${cause.code}]` : ''
    const hint = cause.hint ? `\n     hint: ${cause.hint}` : ''

    return `${error.message}\n     ${cause.message}${code}${hint}`
}

const tools = Object.values(RETRIEVABLE)
const results = await Promise.allSettled(tools.map(seed))

const failed = results.filter(result => result.status === 'rejected')

results.forEach((result, index) => {
    const name = tools[index].name
    console.log(result.status === 'fulfilled' ? `  ok    ${name}` : `  FAIL  ${name}: ${detail(result.reason)}`)
})

console.log(`\n${tools.length - failed.length} of ${tools.length} tools seeded.`)

process.exit(failed.length ? 1 : 0)
