import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema({
    // Who this belongs to. Set from the session, never from the request body.
    owner: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', required: true },
}, { timestamps: true, discriminatorKey: 'itemType' })

/*
  Compound, because no query here asks about one field alone: reads are
  { owner }, { owner, itemType } or { owner, theme }, and the cascade on theme
  delete is { owner, theme }.

  A compound index also serves any leading subset of itself, so { owner: 1,
  itemType: 1 } covers a plain { owner } lookup too. That is why neither field
  carries its own `index: true` any more — a separate one would be redundant
  and still cost a write on every insert.
*/
itemSchema.index({ owner: 1, itemType: 1 })
itemSchema.index({ owner: 1, theme: 1 })

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