import { useState } from 'react'
import { useNotifications } from '../notifications'

// Every user-triggered mutation flows through here, so this catch block is the
// single point where mutation errors converge — reported to the notifications
// sink and swallowed, so callers just check the return (result or undefined).
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
