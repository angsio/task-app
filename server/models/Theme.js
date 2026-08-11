import mongoose from 'mongoose'

const themeSchema = new mongoose.Schema({
    // Who this belongs to. Set from the session, never the request body.
    owner: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: null },
    visible: { type: Boolean, default: true },
}, { timestamps: true })

// Covers both reads: every theme for an owner, and one theme by name. A leading
// subset of a compound index is usable, so { owner } alone still hits this.
themeSchema.index({ owner: 1, name: 1 })

export const Theme = mongoose.model('Theme', themeSchema)