import express from 'express'

import { Theme, Item } from '../models/index.js'
import { ApiError } from '../errors.js'

const router = express.Router()

// (req) -> { _id, owner }
// Matching on the owner too means a stranger's id is simply "not found" rather
// than someone else's theme.
const ownedBy = (req) => ({ _id: req.params.id, owner: req.user.id })

// (body: object) -> object without `owner`
// Ownership comes from the session, never the request, or a caller could hand
// their theme to somebody else.
const withoutOwner = ({ owner, ...fields }) => fields

router.get('/', async (req, res) => {
    const themes = await Theme.find({ owner: req.user.id })
    res.status(200).json(themes)
})

router.post('/', async (req, res) => {
    const theme = await Theme.create({
        owner: req.user.id,
        name: req.body.name,
        color: req.body.color,
    })
    res.status(201).json(theme)
})

router.patch('/:id', async (req, res) => {
    const theme = await Theme.findOne(ownedBy(req))
    if (!theme) throw new ApiError(404, 'Theme not found.')

    theme.set(withoutOwner(req.body))
    await theme.save()

    res.status(200).json(theme)
})

router.delete('/:id', async (req, res) => {
    const theme = await Theme.findOneAndDelete(ownedBy(req))
    if (!theme) throw new ApiError(404, 'Theme not found.')

    await Item.deleteMany({ theme: theme._id, owner: req.user.id })

    res.status(200).json(theme)
})

export { router as themesRouter }
