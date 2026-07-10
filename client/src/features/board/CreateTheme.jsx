import { useMutation } from '../../hooks'
import { createTheme } from '../../api'
import { TextInput } from '../../components'
import { useBoardContext } from './BoardContext'

export const CreateTheme = () => {
    const { mutate: createThemeMutation, loading } = useMutation(createTheme)
    const { upsertTheme } = useBoardContext()

    const submitCreateTheme = async (name) => {
        if (!name.trim()) return false

        const created = await createThemeMutation({ name })
        if (!created) return false

        upsertTheme(created)
        return true
    }

    return (
        <div className="flex flex-col gap-4 p-4 w-64 shrink-0 bg-slate-200">
            <TextInput
                onSubmit={submitCreateTheme}
                disabled={loading}
                placeholder="New theme"
                clearOnSubmit
                submitLabel="Add"
            />
        </div>
    )
}
