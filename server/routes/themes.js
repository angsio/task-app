import express from 'express'

import { Theme, Item } from '../models/index.js'
import { ApiError } from '../errors.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const themes = await Theme.find({})
    res.status(200).json(themes)
})

router.post('/', async (req, res) => {
    const theme = await Theme.create({ name: req.body.name, color: req.body.color })
    res.status(201).json(theme)
})

router.patch('/:id', async (req, res) => {
    const theme = await Theme.findById(req.params.id)
    if (!theme) throw new ApiError(404, 'Theme not found.')
    theme.set(req.body)
    await theme.save()
    res.status(200).json(theme)
})

router.delete('/:id', async (req, res) => {
    const theme = await Theme.findByIdAndDelete(req.params.id)
    if (!theme) throw new ApiError(404, 'Theme not found.')
    await Item.deleteMany({ theme: theme._id })
    res.status(200).json(theme)
})

export { router as themesRouter }