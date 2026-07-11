import { updateItem } from '../../api'
import { useMutation } from '../../hooks'
import { useBoardContext } from './BoardContext'
import { toDateTimeLocal } from './datetime'

export const ReminderFields = ({ item }) => {
    const { mutate: updateItemMutation, loading } = useMutation(updateItem)
    const { upsertItem } = useBoardContext()

    const updateReminderTime = async (value) => {
        const updated = await updateItemMutation(item._id, { reminderTime: value })
        if (!updated) return

        upsertItem(updated)
    }

    return (
        <input
            type="datetime-local"
            className="h-full w-full text-center bg-white"
            defaultValue={toDateTimeLocal(item.reminderTime)}
            onChange={(event) => updateReminderTime(event.target.value)}
            disabled={loading}
        />
    )
}
