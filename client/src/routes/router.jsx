import { createBrowserRouter, Navigate } from 'react-router-dom'
import { FixedNavbarLayout } from '../layouts'
import { BoardPage, SchedulePage } from '../pages'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <FixedNavbarLayout />,
        children: [
            { index: true, element: <Navigate to="/board" replace /> },
            { path: 'board', element: <BoardPage /> },
            { path: 'schedule', element: <SchedulePage /> },
        ],
    },
])