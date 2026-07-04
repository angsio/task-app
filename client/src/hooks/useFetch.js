import { useState, useEffect } from 'react'

export const useFetch = (asyncFn, deps = [asyncFn]) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const runFetch = () => {
        setLoading(true)
        setError(null)

        asyncFn()
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(error => {
                setError(error)
                setLoading(false)
            })
    }

    useEffect(() => {
        runFetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return { data, setData, loading, error }
}
