import { chat, embed } from './useBedrock.js'
import { matchTools } from './useSupabase.js'
import { listItems, listThemes, createItems } from './tools/index.js'

const SYSTEM_PROMPT = 
`You are a helpful assistant that manages items on a schedule. Never use emojis in your responses.
You have access to a tool repository that let's you help the user with managing and reading their schedule.`

// Titan's cosine scores are compressed (~0.1-0.6, where nomic ran ~0.6-0.8): real
// matches clear ~0.15+, off-topic prompts stay under ~0.11. Below this keeps no tool,
// so the model just replies. Retune if the embedding model changes.
const MIN_SIMILARITY = 0.12

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

const runToolCall = async (call) => {
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

export const runAgent = async (prompt) => {
    const tools = await selectTools(prompt)
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
    ]

    const answer = await chat(messages, tools)
    if (!answer.tool_calls?.length) return { reply: answer.content, toolCalls: [], pendingActions: [] }

    const calls = answer.tool_calls.map(call => ({
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments)
    }))

    const pendingActions = calls.filter(call => TOOLS[call.name]?.confirm)
    if (pendingActions.length) return { reply: answer.content, toolCalls: [], pendingActions }

    const toolMessages = await Promise.all(answer.tool_calls.map(runToolCall))
    const summary = await chat([...messages, answer, ...toolMessages])

    return { reply: summary.content, toolCalls: calls, pendingActions: [] }
}

export const executeActions = async (actions) => {
    const results = []

    for (const action of actions) {
        const tool = TOOLS[action.name]
        const result = tool
            ? await tool.handler(action.arguments)
            : { error: `Unknown tool: ${action.name}` }

        results.push({ name: action.name, result })
    }

    return results
}
