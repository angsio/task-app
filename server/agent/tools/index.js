import { findTools } from './findTools.js'
import { listItems } from './listItems.js'
import { listThemes } from './listThemes.js'
import { createItems } from './createItems.js'
import { createThemes } from './createThemes.js'
import { updateItems } from './updateItems.js'
import { updateThemes } from './updateThemes.js'
import { deleteItems } from './deleteItems.js'
import { deleteThemes } from './deleteThemes.js'

/*
  A tool the model can call.

    name, description, parameters   the spec the model sees
    confirm                         the user must approve before it runs
    once                            this call must never execute twice; the
                                    ledger records its id and replays the first
                                    outcome to any repeat. `confirm` routes
                                    through the ledger too
    summarise(args, ctx)            plain lines describing a call awaiting
                                    approval, so the client renders text rather
                                    than reading this tool's argument shape
                                    (confirm tools only)
    run(args, ctx)                  does the work, returns below.
                                    ctx is { owner, timeZone }

  run answers { reply, documents?, removed?, offer? }:
    reply      the ONLY part the model reads back, keep it small, it costs tokens
    documents  items and themes this tool wrote, forwarded to the client so its
               cache updates
    removed    items and themes this tool deleted, forwarded the same way
    offer      tool names to make callable from here on (find_tools only)
*/

// Reachable only by asking find_tools for them. These are what seedTools embeds.
export const RETRIEVABLE = {
    [listItems.name]: listItems,
    [listThemes.name]: listThemes,
    [createItems.name]: createItems,
    [createThemes.name]: createThemes,
    [updateItems.name]: updateItems,
    [updateThemes.name]: updateThemes,
    [deleteItems.name]: deleteItems,
    [deleteThemes.name]: deleteThemes,
}

export const TOOLS = { [findTools.name]: findTools, ...RETRIEVABLE }

export const ENTRY_TOOL = findTools.name

// (tool) -> the OpenAI-style function spec the model is shown
export const toModelSpec = (tool) => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
    },
})
