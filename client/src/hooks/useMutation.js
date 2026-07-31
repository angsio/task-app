import { useState } from 'react'
import { useNotifications } from '../notifications'

/*
  The generic WRITE. Runs only when you call mutate.

  In:  asyncFn  (...args) -> Promise<any>. The HTTP verb lives inside it, so
                this hook serves create, update and delete alike.

  Out: { mutate, loading }
       mutate   (...args) -> Promise<result | null>. null means it failed.
       loading  boolean, true while in flight

  Failures are caught here and pushed to the app-wide notification sink, so
  callers never try/catch and there is no `error` to display. Check for null.
*/
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