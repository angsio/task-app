import { updateTheme } from '../../../api'
import { useMutation } from '../../../hooks'
import { ColorPicker } from '../../../components'
import { useScheduleContext } from '../ScheduleContext'

const styles = {
    card:       'bg-crypt border-b border-border',
    picker:     'rounded-l-sm hover:w-6 transition-[width] duration-200 ease-out',
    visibleOn:  'rounded-sm bg-accent-violet',
    visibleOff: 'rounded-sm bg-border',
    name:       'font-display text-lg text-parchment',
}

export const ThemeCard = ({ theme }) => {

    const { mutate: updateThemeMutation } = useMutation(updateTheme)

    const { upsertTheme } = useScheduleContext()

    const runToggleThemeVisible = async () => {
        const updated = await updateThemeMutation(theme._id, { visible: !theme.visible })
        if (!updated) return

        upsertTheme(updated)
    }

    const runSetThemeColor = async (color) => {
        const updated = await updateThemeMutation(theme._id, { color })
        if (!updated) return

        upsertTheme(updated)
    }

    return (
        <div className={`relative h-full w-full flex flex-row items-center ${styles.card}`}>
            <ColorPicker
                color={theme.color}
                onChange={runSetThemeColor}
                className={`absolute right-0 h-full w-4 ${styles.picker}`}
            />
            <button
                type="button"
                className={`absolute left-4 h-4 w-4 ${theme.visible ? styles.visibleOn : styles.visibleOff}`}
                onClick={runToggleThemeVisible}
            />
            <div className="h-full w-full flex flex-row items-center justify-center px-8">
                <span className={`min-w-0 truncate ${styles.name}`}>{theme.name}</span>
            </div>
        </div>
)}