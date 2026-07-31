import express from 'express'

import { Item, Task, Event, Reminder } from '../models/index.js'
import { ApiError } from '../errors.js'

const router = express.Router()

const MODELS = { Task, Event, Reminder }

// (req) -> { _id, owner }
// Matching on the owner too means a stranger's id is simply "not found" rather
// than someone else's item.
const ownedBy = (req) => ({ _id: req.params.id, owner: req.user.id })

// (body: object) -> object without `owner`
// Ownership comes from the session, never the request, or a caller could hand
// their item to somebody else.
const withoutOwner = ({ owner, ...fields }) => fields

router.get('/', async (req, res) => {
    const filter = { owner: req.user.id }
    if (req.query.theme) filter.theme = req.query.theme
    if (req.query.itemType) filter.itemType = req.query.itemType

    const items = await Item.find(filter)
    res.status(200).json(items)
})

router.post('/', async (req, res) => {
    const Model = MODELS[req.body.itemType]
    if (!Model) throw new ApiError(400, `Unknown item type: ${req.body.itemType}`)

    const item = await Model.create({ ...withoutOwner(req.body), owner: req.user.id })
    res.status(201).json(item)
})

router.patch('/:id', async (req, res) => {
    const item = await Item.findOne(ownedBy(req))
    if (!item) throw new ApiError(404, 'Item not found.')

    item.set(withoutOwner(req.body))
    await item.save()

    res.status(200).json(item)
})

router.delete('/:id', async (req, res) => {
    const item = await Item.findOneAndDelete(ownedBy(req))
    if (!item) throw new ApiError(404, 'Item not found.')

    res.status(200).json(item)
})

export { router as itemsRouter }
