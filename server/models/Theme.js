import mongoose from 'mongoose'

const themeSchema = new mongoose.Schema({
    // Who this belongs to. Every query is scoped by it, so one person's board
    // can never reach another's.
    owner: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: null },
    visible: { type: Boolean, default: true },
}, { timestamps: true })

export const Theme = mongoose.model('Theme', themeSchema)