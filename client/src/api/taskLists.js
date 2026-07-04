const TASKLISTS_URL = 'http://localhost:5000/api/tasklists'

export const getTaskLists = async () => {
    const res = await fetch(TASKLISTS_URL)
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}

export const createTaskList = async (name) => {
    const res = await fetch(TASKLISTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}

export const updateTaskList = async (taskListId, name) => {
    const res = await fetch(TASKLISTS_URL + '/' + taskListId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error('Something went wrong.')
    return res.json()
}

export const deleteTaskList = async (taskListId) => {
    const res = await fetch(TASKLISTS_URL + '/' + taskListId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskListId })
    })
    if (!res.ok) throw new Error('Something went wrong.')
    return taskListId
}
