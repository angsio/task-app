import { useState } from 'react'
import { updateTheme, deleteTheme } from '../../api'
import { useMutation } from '../../hooks'
import { EditableText, List } from '../../components'
import { useBoardContext } from './BoardContext'
import { TaskCard, EventCard, ReminderCard } from './ItemCards'
import { CreateItem } from './CreateItem'

const ITEM_CARDS = { Task: TaskCard, Event: EventCard, Reminder: ReminderCard }

export const ThemeColumn = ({ theme, items }) => {
    const [renaming, setRenaming] = useState(false)

    const { mutate: updateThemeMutation, loading: updatingTheme } = useMutation(updateTheme)
    const { mutate: deleteThemeMutation, loading: deletingTheme } = useMutation(deleteTheme)

    const { upsertTheme, removeTheme, removeItem } = useBoardContext()

    const submitRenameTheme = async (name) => {
        if (!name.trim()) {
            setRenaming(false)
            return
        }

        const updated = await updateThemeMutation(theme._id, { name })
        if (!updated) return

        upsertTheme(updated)
        setRenaming(false)
    }

    const cancelRenameTheme = () => setRenaming(false)

    const runDeleteTheme = async () => {
        const deleted = await deleteThemeMutation(theme._id)
        if (!deleted) return

        removeTheme(deleted)
        items.forEach(item => removeItem(item))
    }

    return (
        <div className="h-full w-full flex flex-col p-2 bg-slate-300">
            <div className="h-1/10 w-full p-2">
                <div className="h-full w-full flex flex-row items-center justify-between p-4 bg-slate-50">
                    <EditableText
                        value={theme.name}
                        active={renaming}
                        onSubmit={submitRenameTheme}
                        onCancel={cancelRenameTheme}
                        disabled={updatingTheme || deletingTheme}
                        inputClassName="bg-white"
                    />
                    <div className="flex flex-row gap-4">
                        <button
                            type="button"
                            className="h-4 w-4 bg-slate-500"
                            onClick={() => setRenaming(true)}
                        />
                        <button
                            type="button"
                            className="h-4 w-4 bg-red-500"
                            onClick={runDeleteTheme}
                        />
                    </div>
                </div>
            </div>
            <List
                items={items}
                keyExtractor={item => item._id}
                flow="x"
                slots={1}
                autoSize="25%"
                className="h-8/10 w-full overflow-y-auto"
            >
                {item => {
                    const Card = ITEM_CARDS[item.itemType]
                    return Card ? <Card item={item} /> : null
                }}
            </List>
            <div className="h-1/10 w-full flex items-center p-2">
                <CreateItem themeId={theme._id} />
            </div>
        </div>
    )
}