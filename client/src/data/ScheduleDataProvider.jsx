import { useEffect, useCallback } from 'react'

import { useCollection } from '../hooks'
import { getThemes, getItems } from '../api'
import { onChangeElsewhere } from '../sync'
import { ScheduleDataContext } from './ScheduleDataContext'

/*
  Owns the themes and items caches for every route inside it.

  In:  children
  Out: those children, with useThemes and useItems available to all of them.

  Board and Schedule read the same two collections and draw them differently, so
  they are fetched once here rather than once per page.

  Renders no loading or error state of its own. Waiting is the consumer's
  decision: a page reading only themes should not sit behind items it never
  looks at, so each page guards on what it uses.

  Reloads when another tab writes, and when this tab is looked at again, which
  is the moment a change made on another device matters.
*/
export const ScheduleDataProvider = ({ children }) => {
    const themes = useCollection(getThemes)
    const items = useCollection(getItems)

    const { refetch: refetchThemes } = themes
    const { refetch: refetchItems } = items

    const refresh = useCallback(() => {
        refetchThemes()
        refetchItems()
    }, [refetchThemes, refetchItems])

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') refresh()
        }

        const stopListening = onChangeElsewhere(refresh)
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onVisible)

        return () => {
            stopListening()
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onVisible)
        }
    }, [refresh])

    return (
        <ScheduleDataContext.Provider value={{ themes, items }}>
            {children}
        </ScheduleDataContext.Provider>
    )
}
