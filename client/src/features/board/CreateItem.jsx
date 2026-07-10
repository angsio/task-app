import { useMutation } from '../../hooks'
import { createItem } from '../../api'
import { TextInput } from '../../components'
import { useBoardContext } from './BoardContext'

export const CreateItem = ({ themeId }) => {
    const { mutate: createItemMutation, loading } = useMutation(createItem)
    const { upsertItem } = useBoardContext()

    const submitCreateItem = async (title) => {
        if (!title.trim()) return false

        const created = await createItemMutation({ itemType: 'Task', theme: themeId, title })
        if (!created) return false

        upsertItem(created)
        return true
    }

    return (
        <TextInput
            onSubmit={submitCreateItem}
            disabled={loading}
            placeholder="New task"
            clearOnSubmit
            submitLabel="Add"
        />
    )
}
