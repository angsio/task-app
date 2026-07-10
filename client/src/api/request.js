const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

export const request = async (path, { method, body } = {}) => {
    if (!method) throw new Error(`request(${path}) needs an explicit method`)

    const res = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error)
    }

    return res.json()
}
