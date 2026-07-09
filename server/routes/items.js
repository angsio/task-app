import express from 'express'

import { Item, Task, Event, Reminder } from '../models/index.js'
import { ApiError, handleError } from '../errors.js'

const router = express.Router()

const MODELS = { Task, Event, Reminder }

router.get('/', async (req, res) => {
    try {
        const filter = {}
        if (req.query.theme) filter.theme = req.query.theme
        if (req.query.itemType) filter.itemType = req.query.itemType

        const items = await Item.find(filter)
        res.json(items)
    } catch (error) {
        handleError(res, error)
    }
})

router.post('/', async (req, res) => {
    try {
        const Model = MODELS[req.body.itemType]
        if (!Model) throw new ApiError(400, `Unknown item type: ${req.body.itemType}`)

        const item = await Model.create(req.body)
        res.status(201).json(item)
    } catch (error) {
        handleError(res, error)
    }
})

router.patch('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
        if (!item) throw new ApiError(404, 'Item not found.')
        item.set(req.body)
        await item.save()
        res.json(item)
    } catch (error) {
        handleError(res, error)
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id)
        if (!item) throw new ApiError(404, 'Item not found.')
        res.json(item)
    } catch (error) {
        handleError(res, error)
    }
})

export { router as itemsRouter }
