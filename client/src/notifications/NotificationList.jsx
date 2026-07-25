import { useNotifications } from './NotificationsContext'

// The terminal destination every error converges to: fixed bottom-right,
// above everything (z over the sticky utility bar). Click a toast to dismiss.
const styles = {
    toast: 'rounded-md border border-danger/50 bg-crypt text-sm text-parchment cursor-pointer',
}

export const NotificationList = () => {
    const { notifications, dismiss } = useNotifications()

    return (
        <div className="fixed bottom-0 right-0 z-50 flex flex-col max-w-sm gap-4 p-10 pointer-events-none">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`p-4 pointer-events-auto ${styles.toast}`}
                    onClick={() => dismiss(notification.id)}
                >
                    {notification.message}
                </div>
            ))}
        </div>
    )
}
