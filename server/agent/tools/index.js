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

/*
  The order a batch of calls has to run in.

  An item cannot exist without a theme, so every theme write lands before every
  item write. A theme delete comes last, because it takes its items with it: run
  before delete_items, it would swallow the items that call was about to name.
  Anything unlisted runs at 0, which is where the reads sit.
*/
const ORDER = {
    [createThemes.name]: 0,
    [updateThemes.name]: 0,
    [createItems.name]: 1,
    [updateItems.name]: 1,
    [deleteItems.name]: 1,
    [deleteThemes.name]: 2,
}

// (calls) -> the same calls in the order they have to run. Stable, so calls of
// equal rank stay in the order the model asked for.
export const inRunOrder = (calls) => [...calls].sort((a, b) => (
    (ORDER[a.function.name] ?? 0) - (ORDER[b.function.name] ?? 0)
))

/*
  (schema, value, path) -> string | null, the first way `value` does not fit
  `schema`, or null when it fits.

  Covers the subset the tool specs use: objects with required properties, arrays
  with a minimum length, enums, strings, numbers and booleans.
*/
const misfit = (schema, value, path) => {
    if (schema.type === 'object') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return `${path} has to be an object`

        for (const field of schema.required ?? []) {
            if (value[field] === undefined || value[field] === null) return `${path}.${field} is required and was missing`
        }

        for (const [field, property] of Object.entries(schema.properties ?? {})) {
            if (value[field] === undefined) continue

            const wrong = misfit(property, value[field], `${path}.${field}`)
            if (wrong) return wrong
        }

        return null
    }

    if (schema.type === 'array') {
        if (!Array.isArray(value)) return `${path} has to be a list`
        if (schema.minItems && value.length < schema.minItems) return `${path} needs at least ${schema.minItems}`

        for (const [index, entry] of value.entries()) {
            const wrong = misfit(schema.items ?? {}, entry, `${path}[${index}]`)
            if (wrong) return wrong
        }

        return null
    }

    if (schema.enum && !schema.enum.includes(value)) return `${path} has to be one of: ${schema.enum.join(', ')}`
    if (schema.type === 'string' && typeof value !== 'string') return `${path} has to be text`
    if (schema.type === 'boolean' && typeof value !== 'boolean') return `${path} has to be true or false`
    if (schema.type === 'number' && typeof value !== 'number') return `${path} has to be a number`

    return null
}

/*
  (call) -> { args } or { error }, the call's arguments, read and checked
  against the tool's own declared parameters.

  Nothing else checks them. A create_items call that arrives without its
  itemType and theme otherwise reaches summarise and is shown to the user as
  "undefined in undefined", one click away from being approved.
*/
export const argumentsOf = (call) => {
    let args

    try {
        args = JSON.parse(call.function.arguments)
    } catch {
        return { error: 'the arguments were not valid JSON' }
    }

    const wrong = misfit(TOOLS[call.function.name]?.parameters ?? {}, args, 'arguments')

    return wrong ? { error: wrong, args } : { args }
}

// (tool) -> the OpenAI-style function spec the model is shown
export const toModelSpec = (tool) => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
    },
})
