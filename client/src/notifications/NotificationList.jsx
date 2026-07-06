import { useNotifications } from './NotificationsContext'

// The terminal destination every error converges to: fixed bottom-right,
// above everything (z over the sticky utility bar). Click a toast to dismiss.
export const NotificationList = () => {
    const { notifications, dismiss } = useNotifications()

    return (
        <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-4 p-10">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className="border bg-white p-4"
                    onClick={() => dismiss(notification.id)}
                >
                    {notification.message}
                </div>
            ))}
        </div>
    )
}
