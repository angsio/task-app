import { useState, useEffect } from 'react'

/*
  The generic READ. Runs asyncFn on mount, and again whenever deps change.

  In:  asyncFn  () -> Promise<any>
       deps     array, what should trigger a refetch. Defaults to [], meaning
                fetch once. If asyncFn closes over a changing value, that value
                belongs here: useQuery(() => getItems(themeId), [themeId]).

  Out: { data, setData, loading, error }
       data     the resolved value, or null until it arrives
       setData  raw setter, for a bespoke local update
       loading  boolean, true while in flight
       error    Error, or null

  Only `deps` triggers a refetch. asyncFn's identity deliberately does not, so
  passing an inline arrow cannot loop. The effect still calls the newest asyncFn,
  because the closure it runs was built by the render that scheduled it.

  A response that lands after deps moved on, or after unmount, is dropped, so
  out-of-order responses cannot overwrite newer data.

  Has no opinion about what `data` is. For an _id-keyed list use useCollection,
  which wraps this.
*/
export const useQuery = (asyncFn, deps = []) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let live = true

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true)
        setError(null)

        asyncFn()
            .then(result => {
                if (!live) return
                setData(result)
                setLoading(false)
            })
            .catch(err => {
                if (!live) return
                setError(err)
                setLoading(false)
            })

        return () => { live = false }
        // asyncFn is intentionally not a dependency, see above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return { data, setData, loading, error }
}
