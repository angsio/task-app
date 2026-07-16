import { updateTheme } from '../../../api'
import { useMutation } from '../../../hooks'
import { useScheduleContext } from '../ScheduleContext'

export const ThemeCard = ({ theme }) => {
    
    const { mutate: updateThemeMutation } = useMutation(updateTheme)

    const { upsertTheme } = useScheduleContext()

    const runToggleThemeVisible = async () => {
        const updated = await updateThemeMutation(theme._id, { visible: !theme.visible })
        if (!updated) return

        upsertTheme(updated)
    }
    
    return (
        <div className="h-full w-full relative flex flex-row items-center bg-slate-100 border-b border-black">
            <div 
                className="absolute right-0 h-full w-4 hover:w-6 transition-[width] duration-200 ease-out" 
                style={{ backgroundColor: theme.color }}
            />
            <button
                type="button"
                className={`absolute left-4 h-4 w-4 ${theme.visible ? 'bg-purple-950' : 'bg-purple-500'}`}
                onClick={runToggleThemeVisible}
            />
            <div className="h-full w-full flex flex-row items-center text-xl pl-12">
                {theme.name}
            </div>
        </div>    
)}