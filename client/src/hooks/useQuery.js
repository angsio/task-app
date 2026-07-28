import { useState, useEffect } from 'react'

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