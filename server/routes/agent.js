import express from 'express'

import { ApiError } from '../errors.js'
import { runAgent } from '../agent/runAgent.js'

const router = express.Router()

// POST { messages, approved? } -> { messages, pending, documents }
// `approved` is present only when answering a pending confirmation, so one
// entry point serves both cases.
router.post('/', async (req, res) => {
    const { messages, approved } = req.body
    if (!messages?.length) throw new ApiError(400, 'Messages are required.')

    res.status(200).json(await runAgent({ messages, approved, owner: req.user.id }))
})

export { router as agentRouter }
