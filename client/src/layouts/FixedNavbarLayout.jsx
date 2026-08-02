import { Outlet } from 'react-router-dom'
import { Navbar } from '../components'
import { ScheduleDataProvider } from '../data'

export const FixedNavbarLayout = () => {
    return (
        <ScheduleDataProvider>
            <div className="h-dvh w-full flex flex-col">
                <Navbar />
                <main className="w-full flex-1 min-h-0">
                    <Outlet />
                </main>
            </div>
        </ScheduleDataProvider>
    )
}
