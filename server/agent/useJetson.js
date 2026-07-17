import { ApiError } from '../errors.js'

const BASE = (process.env.JETSON_URL || 'http://jetson.myraspberrypi.lan:11434/api').replace(/\/$/, '')
const QUERY_MODEL = process.env.QUERY_MODEL || 'qwen3:4b-instruct'
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text'

export const chat = async (messages, tools) => {
    const response = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: QUERY_MODEL,
            stream: false,
            messages,
            tools
        })
    })

    if (!response.ok) throw new ApiError(502, 'The agent is unreachable.')

    const data = await response.json()
    return data.message
}

export const embed = async (text) => {
    const response = await fetch(`${BASE}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: EMBED_MODEL,
            input: text
        })
    })

    if (!response.ok) throw new ApiError(502, 'The embedding model is unreachable.')

    const data = await response.json()
    return data.embeddings[0]
}
