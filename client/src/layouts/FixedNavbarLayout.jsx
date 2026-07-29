import { Outlet } from 'react-router-dom'
import { Navbar } from '../components'

export const FixedNavbarLayout = () => {
    return (
        <div className="h-screen w-screen flex flex-col">
            <Navbar />
            <main className="w-full flex-1 min-h-0">
                <Outlet />
            </main>
        </div>
    )
}