import { useState, useEffect } from 'react'

export const useFetch = (asyncFn) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {

        setData(null)
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
    }, [asyncFn])

    return { data, loading, error }
}