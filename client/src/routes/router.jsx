import { createBrowserRouter, Navigate } from 'react-router-dom'
import { FixedNavbarFixedFooterLayout } from '../layouts'
import { BoardPage } from '../pages'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <FixedNavbarFixedFooterLayout />,
        children: [
            { index: true, element: <Navigate to="/board" replace /> },
            { path: 'board', element: <BoardPage /> },
        ],
    },
])
