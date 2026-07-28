import { useState } from 'react'
import { useNotifications } from '../notifications'

export const useMutation = (asyncFn) => {
    const [loading, setLoading] = useState(false)
    const { notify } = useNotifications()

    const mutate = async (...args) => {
        setLoading(true)

        try {
            return await asyncFn(...args)
        }
        catch (err) {
            notify(err.message)
            return null
        }
        finally {
            setLoading(false)
        }
    }

    return { mutate, loading }
}