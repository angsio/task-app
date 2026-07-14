import { useCollection } from '../../hooks'
import { getThemes, getItems } from '../../api'
import { ScheduleProvider } from './ScheduleContext'
import { Timetable } from './Timetable'
import { Agent } from './Agent'
import { ThemeRows } from './ThemeRows'

export const Schedule = () => {
    const themes = useCollection(getThemes)
    const items = useCollection(getItems)

    if (themes.error) return <p className="p-10">Error: {themes.error.message}</p>
    if (items.error) return <p className="p-10">Error: {items.error.message}</p>
    if (!themes.data || !items.data) return <p className="p-10">Loading...</p>

    return (
        <ScheduleProvider value={{

        }}>
            <div className="h-full w-full flex flex-row">
                <Timetable themes={themes.data} items={items.data} />
                <div className="h-full w-1/4 flex flex-col">
                    <Agent />
                    <ThemeRows />
                </div>
            </div>
        </ScheduleProvider>
    )
}
