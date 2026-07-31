import { findTools } from './findTools.js'
import { listItems } from './listItems.js'
import { listThemes } from './listThemes.js'
import { createItems } from './createItems.js'

/*
  A tool the model can call.

    name, description, parameters   the spec the model sees
    confirm                         the user must approve before it runs
    summarise(args)                 plain lines describing a call awaiting
                                    approval, so the client renders text rather
                                    than reading this tool's argument shape
                                    (confirm tools only)
    run(args, { owner })            does the work for that user, returns below

  run answers { reply, documents?, offer? }:
    reply      the ONLY part the model reads back — keep it small, it costs tokens
    documents  items this tool wrote, forwarded to the client so its cache updates
    offer      tool names to make callable from here on (find_tools only)
*/

// Reachable only by asking find_tools for them. These are what seedTools embeds.
export const RETRIEVABLE = {
    [listItems.name]: listItems,
    [listThemes.name]: listThemes,
    [createItems.name]: createItems,
}

// Everything the loop can dispatch, including the tool that finds the others.
export const TOOLS = { [findTools.name]: findTools, ...RETRIEVABLE }

// The one tool the model always holds; every other is earned through it.
export const ENTRY_TOOL = findTools.name

// (tool) -> the OpenAI-style function spec the model is shown
export const toSpec = (tool) => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
    },
})
