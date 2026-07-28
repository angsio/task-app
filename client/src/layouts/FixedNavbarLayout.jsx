import { Outlet } from 'react-router-dom'
import { Navbar } from '../components'

export const FixedNavbarLayout = () => {
    return (
        <div className="h-screen w-screen flex flex-col">
            <Navbar />
            <main className="h-19/20 w-full">
                <Outlet />
            </main>
        </div>
    )
}