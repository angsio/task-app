import express from 'express'

import { ApiError, handleError } from '../errors.js'

const router = express.Router()

const JETSON_URL = process.env.JETSON_URL || 'http://jetson.myraspberrypi.lan:11434/api/chat'
const AGENT_MODEL = process.env.AGENT_MODEL || 'qwen3:4b-instruct'

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body
        if (!prompt?.trim()) throw new ApiError(400, 'Prompt is required.')

        const response = await fetch(JETSON_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: AGENT_MODEL,
                stream: false,
                messages: [{ role: 'user', content: prompt }]
            })
        })

        if (!response.ok) throw new ApiError(502, 'The agent is unreachable.')

        const data = await response.json()
        res.status(200).json({ reply: data.message.content })
    } catch (error) {
        handleError(res, error)
    }
})

export { router as agentRouter }
