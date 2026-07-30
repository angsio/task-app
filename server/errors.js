// Throw this to choose the status code; anything else becomes a 500.
export class ApiError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.statusCode = statusCode
    }
}

/*
  In:  res    the Express response
       error  any thrown value

  Out: sends { error: string } with a status inferred from the error —
       ApiError keeps its own code, mongoose validation and cast errors
       become 400, everything else is logged and returned as a 500.
*/
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
