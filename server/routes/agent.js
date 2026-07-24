import express from 'express'

import { ApiError, handleError } from '../errors.js'
import { runAgent, resolveActions } from '../agent/runAgent.js'

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const { messages } = req.body
        if (!messages?.length) throw new ApiError(400, 'Messages are required.')

        const result = await runAgent(messages)
        res.status(200).json(result)
    } catch (error) {
        handleError(res, error)
    }
})

router.post('/confirm', async (req, res) => {
    try {
        const { messages, approved } = req.body
        if (!messages?.length) throw new ApiError(400, 'Messages are required.')

        const result = await resolveActions(messages, approved)
        res.status(200).json(result)
    } catch (error) {
        handleError(res, error)
    }
})

export { router as agentRouter }
