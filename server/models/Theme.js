import mongoose from 'mongoose'

const themeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    color: { type: String, default: null },
}, { timestamps: true })

export const Theme = mongoose.model('Theme', themeSchema)
