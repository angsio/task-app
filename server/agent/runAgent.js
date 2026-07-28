import { chat, embed } from './useBedrock.js'
import { matchTools } from './useSupabase.js'
import { listItems, listThemes, createItems } from './tools/index.js'

const SYSTEM_PROMPT =
`You are a helpful assistant that manages items on a user's schedule. Never use emojis in your responses.
You can call tools to read and change the schedule, and you may both call tools and write a reply in the same turn.
Always finish answering everything the user asked, even after using a tool.`

const MIN_SIMILARITY = 0.05
const MAX_STEPS = 8

export const TOOLS = {
    [listItems.name]: listItems,
    [listThemes.name]: listThemes,
    [createItems.name]: createItems
}

const toToolSpec = (tool) => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }
})

const selectTools = async (prompt) => {
    const embedding = await embed(prompt)
    const matches = await matchTools(embedding)

    return matches
        .filter(match => match.similarity > MIN_SIMILARITY)
        .map(match => TOOLS[match.name])
        .filter(Boolean)
        .map(toToolSpec)
}

const withSystem = (messages) =>
    messages[0]?.role === 'system'
        ? messages
        : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

const lastUserPrompt = (messages) =>
    messages.findLast(message => message.role === 'user')?.content ?? ''

const needsConfirm = (call) => TOOLS[call.function.name]?.confirm

const runTool = async (call) => {
    const tool = TOOLS[call.function.name]
    const result = tool
        ? await tool.handler(JSON.parse(call.function.arguments))
        : { error: `Unknown tool: ${call.function.name}` }

    return {
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result)
    }
}

const describeCall = (call) => ({
    id: call.id,
    name: call.function.name,
    arguments: JSON.parse(call.function.arguments)
})

const advance = async (messages, tools) => {
    for (let step = 0; step < MAX_STEPS; step++) {
        const answer = await chat(messages, tools)
        messages.push(answer)

        if (!answer.tool_calls?.length) return { messages, pending: [] }

        for (const call of answer.tool_calls.filter(call => !needsConfirm(call))) {
            messages.push(await runTool(call))
        }

        const pending = answer.tool_calls.filter(needsConfirm)
        if (pending.length) return { messages, pending: pending.map(describeCall) }
    }

    return { messages, pending: [] }
}

export const runAgent = async (incoming) => {
    const messages = withSystem(incoming)
    const tools = await selectTools(lastUserPrompt(messages))

    return advance(messages, tools)
}

export const resolveActions = async (incoming, approved) => {
    const messages = [...incoming]
    const answer = messages.findLast(message => message.role === 'assistant')

    const pending = (answer?.tool_calls ?? []).filter(call =>
        needsConfirm(call) && !messages.some(message => message.tool_call_id === call.id)
    )

    for (const call of pending) {
        messages.push(approved
            ? await runTool(call)
            : { role: 'tool', tool_call_id: call.id, content: JSON.stringify({ cancelled: true, message: 'The user declined this action. Nothing was created or changed. Tell the user it was cancelled and do not claim it was done.' }) }
        )
    }

    const tools = await selectTools(lastUserPrompt(messages))
    return advance(messages, tools)
}