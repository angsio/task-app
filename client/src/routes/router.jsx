import { createBrowserRouter, Navigate } from 'react-router-dom'
import { FixedNavbarFixedFooterLayout } from '../layouts'
import { TasksPage } from '../pages'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <FixedNavbarFixedFooterLayout />,
        children: [
            { index: true, element: <Navigate to="/tasks" replace /> },
            { path: 'tasks', element: <TasksPage /> },
        ],
    },
])
