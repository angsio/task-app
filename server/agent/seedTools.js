import 'dotenv/config'

import { embed } from './useJetson.js'
import { upsertTool } from './useSupabase.js'
import { TOOLS } from './runAgent.js'

const seed = async (tool) => {
    const embedding = await embed(`search_document: ${tool.description}`)
    await upsertTool(tool.name, tool.description, embedding)
    console.log(`Seeded tool: ${tool.name}`)
}

await Promise.all(Object.values(TOOLS).map(seed))
process.exit(0)
