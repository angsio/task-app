const TASKLISTS_URL = 'http://localhost:5000/api/tasklists/'
const TASK_EXTENSION = '/tasks'

export const createTask = async (taskListId, name) => {
    const res = await fetch(TASKLISTS_URL + taskListId + TASK_EXTENSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}
