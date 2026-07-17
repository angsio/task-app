import express from 'express'

import { ApiError, handleError } from '../errors.js'
import { runAgent, executeActions } from '../agent/runAgent.js'

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body
        if (!prompt?.trim()) throw new ApiError(400, 'Prompt is required.')

        const result = await runAgent(prompt)
        res.status(200).json(result)
    } catch (error) {
        handleError(res, error)
    }
})

router.post('/execute', async (req, res) => {
    try {
        const { actions } = req.body
        if (!actions?.length) throw new ApiError(400, 'No actions to execute.')

        const results = await executeActions(actions)
        res.status(200).json({ results })
    } catch (error) {
        handleError(res, error)
    }
})

export { router as agentRouter }