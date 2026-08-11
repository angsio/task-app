import express from 'express'

import { ApiError } from '../errors.js'
import { runAgent } from '../agent/runAgent.js'

const router = express.Router()

// POST { messages, approved?, timeZone? } -> { messages, pending, documents, removed }
// `approved` is present only when answering a pending confirmation, so one
// entry point serves both cases.
router.post('/', async (req, res) => {
    const { messages, approved, timeZone } = req.body
    if (!messages?.length) throw new ApiError(400, 'Messages are required.')

    res.status(200).json(await runAgent({ messages, approved, owner: req.user.id, timeZone }))
})

export { router as agentRouter }
