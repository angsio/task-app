import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import { themesRouter, itemsRouter, agentRouter } from './routes/index.js'
import { errorHandler } from './errors.js'
import { requireUser } from './auth.js'

const app = express()
const PORT = process.env.PORT || 5001

const ORIGINS = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean)

// Same-origin in production (nginx serves both), so this matters only in dev
// and for any future cross-origin caller. A wildcard cannot carry credentials.
app.use(cors({ origin: ORIGINS.length ? ORIGINS : true, credentials: true }))
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI, { dbName: 'task-app' })
    .then(() => console.log('Connected successfully.'))
    .catch(err => console.error('Failed to connect:', err))

// requireUser guards every API route, so no handler can forget it and no new
// route is public by accident.
app.use('/api/themes', requireUser, themesRouter)
app.use('/api/items', requireUser, itemsRouter)
app.use('/api/agent', requireUser, agentRouter)

// Last: every route's rejected promise lands here (Express 5 forwards them).
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running in development mode on port ${PORT}`)
})
