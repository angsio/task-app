import { useCollection } from '../../hooks'
import { getThemes, getItems } from '../../api'
import { ScheduleProvider } from './ScheduleContext'
import { Timetable } from './Timetable'
import { Agent } from './Agent'
import { ThemeRows } from './ThemeRows'

const styles = {
    aside:  'border-l border-border',
    notice: 'text-parchment-dim',
    error:  'text-danger',
}

export const Schedule = () => {
    const themes = useCollection(getThemes)
    const items = useCollection(getItems)

    if (themes.error) return <p className={`p-10 ${styles.error}`}>Error: {themes.error.message}</p>
    if (items.error) return <p className={`p-10 ${styles.error}`}>Error: {items.error.message}</p>
    if (!themes.data || !items.data) return <p className={`p-10 ${styles.notice}`}>Loading...</p>

    return (
        <ScheduleProvider value={{
            upsertItem: items.upsert,
            upsertTheme: themes.upsert
        }}>
            <div className="h-full w-full flex flex-row">
                <Timetable themes={themes.data} items={items.data} />
                <div className={`h-full w-1/4 flex flex-col ${styles.aside}`}>
                    <Agent />
                    <ThemeRows themes={themes.data} />
                </div>
            </div>
        </ScheduleProvider>
    )
}
