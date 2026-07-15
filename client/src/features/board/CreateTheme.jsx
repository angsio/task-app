import { useState } from 'react'
import { useMutation } from '../../hooks'
import { createTheme } from '../../api'
import { EditableText } from '../../components'
import { useBoardContext } from './BoardContext'

export const CreateTheme = () => {
    const [creating, setCreating] = useState(false)

    const { mutate: createThemeMutation, loading } = useMutation(createTheme)
    const { upsertTheme } = useBoardContext()

    const submitCreateTheme = async (name) => {
        if (!name.trim()) {
            setCreating(false)
            return
        }

        const created = await createThemeMutation({ name, color: "#f22742" })
        if (!created) return

        upsertTheme(created)
        setCreating(false)
    }

    const cancelCreateTheme = () => setCreating(false)

    if (!creating) {
        return (
            <div className="h-[calc(10%+1rem)] w-full p-4 bg-slate-200">
                <button 
                    type="button"
                    className="h-full w-full bg-green-400"
                    onClick={() => setCreating(true)}
                >
                    New theme
                </button>
            </div>
        )
    }

    return (
        <div className="h-[calc(10%+1rem)] w-full p-4 bg-slate-200">
            <EditableText
                value=""
                active
                onSubmit={submitCreateTheme}
                onCancel={cancelCreateTheme}
                disabled={loading}
                placeholder="New theme"
                inputClassName="h-full w-full bg-white px-4"
            />
        </div>
    )
}
