import { useState } from 'react'
import { updateTheme, deleteTheme } from '../../api'
import { useMutation } from '../../hooks'
import { EditableText, List, ColorPicker } from '../../components'
import { useBoardContext } from './BoardContext'
import { TaskCard, EventCard, ReminderCard } from './ItemCards'
import { CreateItem } from './CreateItem'

const ITEM_CARDS = { Task: TaskCard, Event: EventCard, Reminder: ReminderCard }

const styles = {
    column:    'bg-obsidian border border-border rounded-lg',
    header:    'bg-crypt border border-border rounded-md',
    name:      'font-display text-parchment',
    input:     'bg-void border border-border rounded-md px-2 text-parchment focus:border-accent focus:outline-none',
    editBtn:   'rounded-sm bg-accent-violet/80 transition-colors hover:bg-accent-violet',
    deleteBtn: 'rounded-sm bg-danger/80 transition-colors hover:bg-danger',
}

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

    const runSetThemeColor = async (color) => {
        const updated = await updateThemeMutation(theme._id, { color })
        if (!updated) return

        upsertTheme(updated)
    }

    const runDeleteTheme = async () => {
        const deleted = await deleteThemeMutation(theme._id)
        if (!deleted) return

        removeTheme(deleted)
        items.forEach(item => removeItem(item))
    }

    return (
        <div className={`h-full w-full flex flex-col p-2 ${styles.column}`}>
            <div className="h-1/10 w-full p-2">
                <div className={`h-full w-full flex flex-row items-center justify-between p-4 gap-4 ${styles.header}`}>
                    <EditableText
                        value={theme.name}
                        active={renaming}
                        onSubmit={submitRenameTheme}
                        onCancel={cancelRenameTheme}
                        disabled={updatingTheme || deletingTheme}
                        maxLength={40}
                        className={`flex-1 min-w-0 ${styles.name}`}
                        inputClassName={styles.input}
                    />
                    <div className="flex flex-row gap-4">
                        <ColorPicker
                            color={theme.color}
                            onChange={runSetThemeColor}
                            className="h-4 w-4 rounded-sm"
                        />
                        <button
                            type="button"
                            className={`h-4 w-4 ${styles.editBtn}`}
                            onClick={() => setRenaming(true)}
                        />
                        <button
                            type="button"
                            className={`h-4 w-4 ${styles.deleteBtn}`}
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