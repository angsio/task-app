// Throw this to choose the status code; anything else becomes a 500.
export class ApiError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.statusCode = statusCode
    }
}

/*
  The one place an error becomes a response. Mounted last in index.js.

  In:  error  any thrown value. Express 5 forwards a rejected promise from any
              async handler here, so routes never try/catch

  Out: sends { error: string }, with the status inferred from the error:
       ApiError keeps its own code, mongoose ValidationError and CastError
       become 400, and anything else is logged and returned as a 500.
*/
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
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
