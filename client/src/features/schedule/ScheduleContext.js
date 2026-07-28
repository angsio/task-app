import { createContext, useContext } from 'react'

const ScheduleContext = createContext(null)

export const ScheduleProvider = ScheduleContext.Provider

export const useScheduleContext = () => {
    const context = useContext(ScheduleContext)
    if (!context) {
        throw new Error('useScheduleContext must be used within a ScheduleProvider')
    }
    return context
}