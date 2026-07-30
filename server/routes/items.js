import express from 'express'

import { Item, Task, Event, Reminder } from '../models/index.js'
import { ApiError } from '../errors.js'

const router = express.Router()

const MODELS = { Task, Event, Reminder }

router.get('/', async (req, res) => {
    const filter = {}
    if (req.query.theme) filter.theme = req.query.theme
    if (req.query.itemType) filter.itemType = req.query.itemType

    const items = await Item.find(filter)
    res.status(200).json(items)
})

router.post('/', async (req, res) => {
    const Model = MODELS[req.body.itemType]
    if (!Model) throw new ApiError(400, `Unknown item type: ${req.body.itemType}`)

    const item = await Model.create(req.body)
    res.status(201).json(item)
})

router.patch('/:id', async (req, res) => {
    const item = await Item.findById(req.params.id)
    if (!item) throw new ApiError(404, 'Item not found.')
    item.set(req.body)
    await item.save()
    res.status(200).json(item)
})

router.delete('/:id', async (req, res) => {
    const item = await Item.findByIdAndDelete(req.params.id)
    if (!item) throw new ApiError(404, 'Item not found.')
    res.status(200).json(item)
})

export { router as itemsRouter }