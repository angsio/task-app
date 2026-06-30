import { useState, useEffect } from 'react'

const useFetch = (url) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {

        setData(null)
        setLoading(true)
        setError(null)

        fetch(url)
            .then(res => {
                if (!res.ok) { throw new Error('Something went wrong.') }
                return res.json()
            })
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(error => {
                setError(error)
                setLoading(false)
            })
    }, [url])

    return { data, loading, error }
}

export default useFetch