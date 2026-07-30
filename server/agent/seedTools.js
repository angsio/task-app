import 'dotenv/config'

import { embed } from './useBedrock.js'
import { upsertTool } from './useSupabase.js'
import { RETRIEVABLE } from './tools/index.js'

// (tool) -> Promise<void>, embeds the description and writes one index row
const seed = async (tool) => {
    const embedding = await embed(tool.description)
    await upsertTool(tool.name, tool.description, embedding)
    console.log(`Seeded tool: ${tool.name}`)
}

await Promise.all(Object.values(RETRIEVABLE).map(seed))
process.exit(0)