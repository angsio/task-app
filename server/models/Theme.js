import mongoose from 'mongoose'

const themeSchema = new mongoose.Schema({
    // Who this belongs to. Every query is scoped by it, so one person's board
    // can never reach another's.
    owner: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: null },
    visible: { type: Boolean, default: true },
}, { timestamps: true })

/*
  Two shapes of read: every theme for a person, and one theme by name for the
  agent. The compound covers both, since a leading subset of a compound index
  is itself usable — { owner } alone still hits this.
*/
themeSchema.index({ owner: 1, name: 1 })

export const Theme = mongoose.model('Theme', themeSchema)