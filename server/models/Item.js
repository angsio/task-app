import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true, index: true },
}, { timestamps: true, discriminatorKey: 'itemType' })

export const Item = mongoose.model('Item', itemSchema)

export const Task = Item.discriminator('Task', new mongoose.Schema({
    completed: { type: Boolean, default: false },
    hasDeadline: { type: Boolean, default: false },
    deadline: { type: Date, default: null }
}))

export const Event = Item.discriminator('Event', new mongoose.Schema({
    timeStart: { type: Date, required: true },
    timeEnd: { type: Date, required: true }
}))

export const Reminder = Item.discriminator('Reminder', new mongoose.Schema({
    reminderTime: { type: Date, required: true }
}))