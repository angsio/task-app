import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import { themesRouter, itemsRouter, agentRouter } from './routes/index.js'
import { errorHandler } from './errors.js'

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI, { dbName: 'task-app' })
    .then(() => console.log('Connected successfully.'))
    .catch(err => console.error('Failed to connect:', err))

app.use('/api/themes', themesRouter)
app.use('/api/items', itemsRouter)
app.use('/api/agent', agentRouter)

// Last: every route's rejected promise lands here (Express 5 forwards them).
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running in development mode on port ${PORT}`)
})
