import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts'
import { TasksPage } from '../pages'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { index: true, element: <Navigate to="/tasks" replace /> },
            { path: 'tasks', element: <TasksPage /> },
        ],
    },
])
