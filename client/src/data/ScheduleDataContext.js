import { createContext, useContext } from 'react'

export const ScheduleDataContext = createContext(null)

/*
  The two server collections, owned once above the routes.

  In:  nothing
  Out: { data, loading, error, refetch, upsert, remove } for that collection.

  Two hooks rather than one, so a component that only touches themes says only
  useThemes() and never waits on items.
*/
const useScheduleData = () => {
    const context = useContext(ScheduleDataContext)
    if (!context) {
        throw new Error('useThemes and useItems must be used within a ScheduleDataProvider')
    }
    return context
}

export const useThemes = () => useScheduleData().themes

export const useItems = () => useScheduleData().items
