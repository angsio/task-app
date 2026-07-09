const TASKS_URL = 'http://localhost:5000/api/tasks'

export const getTasks = async () => {
    const res = await fetch(TASKS_URL)
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}

export const createTask = async (taskListId, name) => {
    const res = await fetch(TASKS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, taskList: taskListId })
    })
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}

export const updateTask = async (taskId, fields) => {
    const res = await fetch(TASKS_URL + '/' + taskId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
    })
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}

export const deleteTask = async (taskId) => {
    const res = await fetch(TASKS_URL + '/' + taskId, {
        method: 'DELETE',
    })
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}
