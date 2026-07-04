import { Outlet } from 'react-router-dom'
import { Navbar, Footer } from '../components'

export const FixedNavbarFixedFooterLayout = () => {
    return (
        <div className="h-screen w-screen flex flex-col">
            <Navbar />
            <main className="flex-1 w-full overflow-y-auto">
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}
