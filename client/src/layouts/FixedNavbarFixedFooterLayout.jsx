import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar, Footer } from '../components'
import { CreateTaskListForm } from '../features/tasklists'

export const FixedNavbarFixedFooterLayout = () => {
    const [taskListsVersion, setTaskListsVersion] = useState(0)

    return (
        <div className="h-screen w-screen flex flex-col">
            <Navbar>
                <CreateTaskListForm onCreated={() => setTaskListsVersion((v) => v + 1)} />
            </Navbar>
            <main className="flex-1 w-full overflow-y-auto">
                <Outlet context={{ taskListsVersion }} />
            </main>
            <Footer />
        </div>
    )
}
