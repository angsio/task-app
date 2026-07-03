const mongoose = require('mongoose')
const taskSchema = require('./Task')

const taskListSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    tasks: [taskSchema],
}, { timestamps: true })

module.exports = mongoose.model('TaskList', taskListSchema)