import { updateItem } from '../../api'
import { useMutation } from '../../hooks'
import { useBoardContext } from './BoardContext'
import { toDateTimeLocal } from './datetime'

export const EventFields = ({ item }) => {
    const { mutate: updateItemMutation, loading } = useMutation(updateItem)
    const { upsertItem } = useBoardContext()

    const updateField = async (field, value) => {
        const updated = await updateItemMutation(item._id, { [field]: value })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <div className="flex flex-col gap-4">
            <input
                type="datetime-local"
                className="bg-white"
                defaultValue={toDateTimeLocal(item.timeStart)}
                onChange={(event) => updateField('timeStart', event.target.value)}
                disabled={loading}
            />
            <input
                type="datetime-local"
                className="bg-white"
                defaultValue={toDateTimeLocal(item.timeEnd)}
                onChange={(event) => updateField('timeEnd', event.target.value)}
                disabled={loading}
            />
        </div>
    )
}
