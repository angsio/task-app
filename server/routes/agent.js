import express from 'express'

import { ApiError, handleError } from '../errors.js'
import { runAgent } from '../agent/runAgent.js'

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body
        if (!prompt?.trim()) throw new ApiError(400, 'Prompt is required.')

        const reply = await runAgent(prompt)
        res.status(200).json({ reply })
    } catch (error) {
        handleError(res, error)
    }
})

export { router as agentRouter }