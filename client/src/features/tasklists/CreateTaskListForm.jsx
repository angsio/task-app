import { useState } from 'react'
import { createTaskList } from '../../api'

export const CreateTaskListForm = ({ onCreated }) => {
    const [name, setName] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!name.trim()) return

        await createTaskList(name)
        setName('')
        onCreated()
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="New task list name"
            />
            <button type="submit">Add</button>
        </form>
    )
}
