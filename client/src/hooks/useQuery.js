import { useState, useEffect } from 'react'

/*
  The generic READ. Runs asyncFn on mount and whenever deps change.

  In:  asyncFn  () -> Promise<any>
       deps     array, the effect's dependencies

  Out: { data, setData, loading, error }
       data     the resolved value, or null until it arrives
       setData  raw setter, for a bespoke local update
       loading  boolean, true while in flight
       error    Error, or null

  Has no opinion about what `data` is — a number, an object, a list. For an
  _id-keyed list you want useCollection, which wraps this.
*/
export const useQuery = (asyncFn, deps = [asyncFn]) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const runQuery = () => {
        setLoading(true)
        setError(null)

        asyncFn()
            .then(result => {
                setData(result)
                setLoading(false)
            })
            .catch(err => {
                setError(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        runQuery()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return { data, setData, loading, error }
}