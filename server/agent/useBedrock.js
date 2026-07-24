import { ApiError } from '../errors.js'

// One bearer token, but the two models sit in different Bedrock regions: the
// gpt-oss chat model in us-east-2, the Titan embedder in us-east-1.
const TOKEN = process.env.AWS_MODELS_TOKEN
const CHAT_URL = process.env.CHAT_URL
const EMBED_URL = process.env.EMBED_URL
// gpt-oss returns its chain-of-thought inline, wrapped in <reasoning>...</reasoning>.
// Strip it so the user only ever sees the final answer.
const stripReasoning = (content) => (content ?? '').replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '').trim()

export const chat = async (messages, tools) => {
    const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages,
            tools
        })
    })

    if (!response.ok) throw new ApiError(502, 'The agent is unreachable.')

    const data = await response.json()
    const message = data.choices[0].message
    return { ...message, content: stripReasoning(message.content) }
}

export const embed = async (text) => {
    const response = await fetch(EMBED_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputText: text
        })
    })

    if (!response.ok) throw new ApiError(502, 'The embedding model is unreachable.')

    const data = await response.json()
    return data.embedding
}
