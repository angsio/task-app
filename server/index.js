require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const TaskList = require('./models/TaskList')

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

const MONGODB_URI = process.env.MONGODB_URI

mongoose.connect(MONGODB_URI, { dbName: 'task-app' })
    .then(() => console.log('Connected successfully.'))
    .catch(err => console.error('Failed to connect:', err))

// -- tasklists --

app.get('/api/tasklists', async (req, res) => {
    try {
        const taskLists = await TaskList.find({})
        res.json(taskLists)
    }
    catch (error) {
        console.error('Failed to query:', error)
        res.status(500).json({
            error: 'Database read failed.'
        })
    }
})

app.post('/api/tasklists', async (req, res) => {
    try {
        const taskList = await TaskList.create({ name: req.body.name })
        res.status(201).json(taskList)
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message })
        }
        console.error('Failed to create tasklist:', error)
        res.status(500).json({
            error: 'Database write failed.'
        })
    }
})

app.patch('/api/tasklists/:id', async (req, res) => {
    try {
        const taskList = await TaskList.findByIdAndUpdate(
            req.params.id,
            { name: req.body.name },
            { new: true, runValidators: true }
        )
        if (!taskList) return res.status(404).json({ error: 'Tasklist not found.' })
        res.json(taskList)
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message })
        }
        console.error('Failed to update tasklist:', error)
        res.status(500).json({
            error: 'Database write failed.'
        })
    }
})

app.delete('/api/tasklists/:id', async (req, res) => {
    try {
        const taskList = await TaskList.findByIdAndDelete(req.params.id)
        if (!taskList) return res.status(404).json({ error: 'Tasklist not found.' })
        res.json(taskList)
    }
    catch (error) {
        console.error('Failed to delete tasklist:', error)
        res.status(500).json({
            error: 'Database write failed.'
        })
    }
})

// -- tasks (nested within a tasklist) --

app.get('/api/tasklists/:id/tasks', async (req, res) => {
    try {
        const taskList = await TaskList.findById(req.params.id)
        if (!taskList) return res.status(404).json({ error: 'Tasklist not found.' })
        res.json(taskList.tasks)
    }
    catch (error) {
        console.error('Failed:', error)
        res.status(500).json({
            error: 'Database read failed.'
        })
    }
})

app.post('/api/tasklists/:id/tasks', async (req, res) => {
    try {
        const taskList = await TaskList.findById(req.params.id)
        if (!taskList) return res.status(404).json({ error: 'Tasklist not found.' })

        taskList.tasks.push({ name: req.body.name })
        await taskList.save()
        res.status(201).json(taskList)
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message })
        }
        console.error('Failed to create task:', error)
        res.status(500).json({
            error: 'Database write failed.'
        })
    }
})

app.patch('/api/tasklists/:id/tasks/:taskId', async (req, res) => {
    try {
        const taskList = await TaskList.findById(req.params.id)
        if (!taskList) return res.status(404).json({ error: 'Tasklist not found.' })

        const task = taskList.tasks.id(req.params.taskId)
        if (!task) return res.status(404).json({ error: 'Task not found.' })

        if (req.body.name !== null) task.name = req.body.name
        if (req.body.completed !== null) task.completed = req.body.completed

        await taskList.save()
        res.json(taskList)
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message })
        }
        console.error('Failed to update task:', error)
        res.status(500).json({
            error: 'Database write failed.'
        })
    }
})

app.delete('/api/tasklists/:id/tasks/:taskId', async (req, res) => {
    try {
        const taskList = await TaskList.findById(req.params.id)
        if (!taskList) return res.status(404).json({ error: 'Tasklist not found.' })

        const task = taskList.tasks.pull(req.params.taskId)
        if (!task) return res.status(404).json({ error: 'Task not found.'})
        
        await taskList.save()
        res.json(taskList)
    }
    catch (error) {
        console.error('Failed to delete task:', error)
        res.status(500).json({
            error: 'Database write failed.'
        })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running in development mode on port ${PORT}`);
})
