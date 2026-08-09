import { useState } from 'react'
import { useNotifications } from '../notifications'
import { announceChange } from '../sync'

/*
  The generic WRITE. Runs only when you call mutate.

  In:  asyncFn  (...args) -> Promise<any>. The HTTP verb lives inside it, so
                this hook serves create, update and delete alike.

  Out: { mutate, loading }
       mutate   (...args) -> Promise<result | null>. null is failed.
       loading  boolean
*/

export const useMutation = (asyncFn) => {
    const [loading, setLoading] = useState(false)
    const { notify } = useNotifications()

    const mutate = async (...args) => {
        setLoading(true)

        try {
            const result = await asyncFn(...args)
            announceChange()
            return result
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