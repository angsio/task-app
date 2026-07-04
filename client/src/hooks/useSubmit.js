import { useState } from 'react'

export const useSubmit = (asyncFn) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const submit = async (...args) => {
        setLoading(true)
        setError(null)

        try {
            return await asyncFn(...args)
        }
        catch (err) {
            setError(err)
            return undefined
        }
        finally {
            setLoading(false)
        }
    }

    return { submit, loading, error }
}
