const { Schema } = require('mongoose')

const taskSchema = new Schema({
    name: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = taskSchema
