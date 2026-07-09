export class ApiError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.statusCode = statusCode
    }
}

export const handleError = (res, error) => {
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message })
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ error: `Invalid ${error.path}: ${error.value}` })
    }
    console.error(error)
    return res.status(500).json({ error: 'Something went wrong.' })
}
