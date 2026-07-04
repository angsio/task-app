import { useState } from 'react'

import { useSubmit } from '../../hooks'
import { createTaskList } from '../../api'

import { useTaskListsContext } from './TaskListsContext'

export const TaskUtilityBar = () => {

    const [name, setName] = useState('')

    const { submit, loading, error } = useSubmit(createTaskList)
    const { handleTaskListCreated } = useTaskListsContext()

    const handleSubmit = async (event) => {
        
        event.preventDefault()
        if (!name.trim()) return

        const created = await submit(name)
        if (!created) return

        setName('')
        handleTaskListCreated(created)
    }

    return (
        <div className="sticky top-0 z-10 h-1/20 w-full bg-rose-800 flex flex-row px-10">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="New Task List"
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>Add</button>
            </form>
            {error && <p>{error.message}</p>}
        </div>
    )
}
