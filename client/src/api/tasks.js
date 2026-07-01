const TASKS_URL = 'http://localhost:5000/api/data'

export const getTasks = async () => {
    const res = await fetch(TASKS_URL)
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}
