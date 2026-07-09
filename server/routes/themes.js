import express from 'express'

import { Theme, Item } from '../models/index.js'
import { ApiError, handleError } from '../errors.js'

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const themes = await Theme.find({})
        res.json(themes)
    } catch (error) {
        handleError(res, error)
    }
})

router.post('/', async (req, res) => {
    try {
        const theme = await Theme.create({ name: req.body.name, color: req.body.color })
        res.status(201).json(theme)
    } catch (error) {
        handleError(res, error)
    }
})

router.patch('/:id', async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id)
        if (!theme) throw new ApiError(404, 'Theme not found.')
        theme.set(req.body)
        await theme.save()
        res.json(theme)
    } catch (error) {
        handleError(res, error)
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const theme = await Theme.findByIdAndDelete(req.params.id)
        if (!theme) throw new ApiError(404, 'Theme not found.')
        await Item.deleteMany({ theme: theme._id })
        res.json(theme)
    } catch (error) {
        handleError(res, error)
    }
})

export { router as themesRouter }
