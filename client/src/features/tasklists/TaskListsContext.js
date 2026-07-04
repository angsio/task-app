import { createContext, useContext } from 'react'

const TaskListsContext = createContext(null)

export const TaskListsProvider = TaskListsContext.Provider

export const useTaskListsContext = () => {
    const context = useContext(TaskListsContext)
    if (!context) {
        throw new Error('useTaskListsContext must be used within a TaskListsProvider')
    }
    return context
}
