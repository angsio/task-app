import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { NotificationsProvider, NotificationList } from './notifications'

export const App = () => {
	return (
		<NotificationsProvider>
			<RouterProvider router={router} />
			<NotificationList />
		</NotificationsProvider>
	)
}
