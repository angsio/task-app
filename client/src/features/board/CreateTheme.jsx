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

        const created = await createThemeMutation({ name })
        if (!created) return

        upsertTheme(created)
        setCreating(false)
    }

    const cancelCreateTheme = () => setCreating(false)

    if (!creating) {
        return (
            <div className="flex flex-col gap-4 p-4 w-64 shrink-0 self-start bg-slate-200">
                <button type="button" className="p-4 bg-green-400" onClick={() => setCreating(true)}>
                    New theme
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-4 w-64 shrink-0 self-start bg-slate-300">
            <EditableText
                value=""
                active
                onSubmit={submitCreateTheme}
                onCancel={cancelCreateTheme}
                disabled={loading}
                placeholder="New theme"
                inputClassName="w-full bg-white"
            />
        </div>
    )
}
