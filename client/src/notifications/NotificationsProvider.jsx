import { useState, useCallback } from 'react'
import { NotificationsContext } from './NotificationsContext'

// App-wide sink for transient messages (currently: mutation failures). Any code
// can call notify(message); the list renders them and auto-dismisses each.
export const NotificationsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([])

    const dismiss = useCallback((id) => {
        setNotifications((current) => current.filter((n) => n.id !== id))
    }, [])

    const notify = useCallback((message) => {
        const id = crypto.randomUUID()
        setNotifications((current) => [...current, { id, message }])
        setTimeout(() => dismiss(id), 5000)
    }, [dismiss])

    return (
        <NotificationsContext.Provider value={{ notifications, notify, dismiss }}>
            {children}
        </NotificationsContext.Provider>
    )
}
