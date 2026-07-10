import { updateItem } from '../../api'
import { useMutation } from '../../hooks'
import { useBoardContext } from './BoardContext'

export const TaskAction = ({ item }) => {
    const { mutate: updateItemMutation, loading } = useMutation(updateItem)
    const { upsertItem } = useBoardContext()

    const runToggleCompleted = async () => {
        const updated = await updateItemMutation(item._id, { completed: !item.completed })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <button
            type="button"
            className={`h-4 w-4 ${item.completed ? 'bg-slate-500' : 'bg-slate-200'}`}
            onClick={runToggleCompleted}
            disabled={loading}
        />
    )
}
