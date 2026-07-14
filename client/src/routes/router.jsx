import { createBrowserRouter, Navigate } from 'react-router-dom'
import { FixedNavbarFixedFooterLayout, FixedNavbarLayout } from '../layouts'
import { BoardPage, SchedulePage } from '../pages'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <FixedNavbarFixedFooterLayout />,
        children: [
            { index: true, element: <Navigate to="/board" replace /> },
            { path: 'board', element: <BoardPage /> },
        ],
    },
    {
        element: <FixedNavbarLayout />,
        children: [
            { path: '/schedule', element: <SchedulePage /> },
        ],
    },
])
