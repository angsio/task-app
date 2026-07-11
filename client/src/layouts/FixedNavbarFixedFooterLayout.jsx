import { Outlet } from 'react-router-dom'
import { Navbar, Footer } from '../components'

export const FixedNavbarFixedFooterLayout = () => {
    return (
        <div className="h-screen w-screen flex flex-col">
            <Navbar />
            <main className="h-9/10 w-full">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}
