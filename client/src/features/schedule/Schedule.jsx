import { useThemes, useItems } from '../../data'
import { Timetable } from './Timetable'
import { Agent } from './Agent'
import { ThemeRows } from './ThemeRows'

const styles = {
    aside:  'border-t border-border lg:border-t-0 lg:border-l',
    notice: 'text-parchment-dim',
    error:  'text-danger',
}

export const Schedule = () => {
    const themes = useThemes()
    const items = useItems()

    if (themes.error) return <p className={`p-10 ${styles.error}`}>Error: {themes.error.message}</p>
    if (items.error) return <p className={`p-10 ${styles.error}`}>Error: {items.error.message}</p>
    if (!themes.data || !items.data) return <p className={`p-10 ${styles.notice}`}>Loading...</p>

    return (
        <div className="h-full w-full flex flex-col lg:flex-row">
            <Timetable themes={themes.data} items={items.data} />
            <div className={`h-2/5 w-full flex flex-col lg:h-full lg:w-1/4 ${styles.aside}`}>
                <Agent />
                <ThemeRows themes={themes.data} />
            </div>
        </div>
    )
}
