import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { NotificationsProvider, NotificationList } from './notifications'
import { useSessionWatch } from './hooks'

export const App = () => {
	useSessionWatch()

	return (
		<NotificationsProvider>
			<RouterProvider router={router} />
			<NotificationList />
		</NotificationsProvider>
	)
}