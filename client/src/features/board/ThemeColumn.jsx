import { useState } from 'react'
import { updateTheme, deleteTheme } from '../../api'
import { useMutation } from '../../hooks'
import { EditableText, List } from '../../components'
import { useBoardContext } from './BoardContext'
import { ItemCard } from './ItemCard'
import { CreateItem } from './CreateItem'

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
        <div className="flex flex-col gap-4 p-4 w-64 shrink-0 h-140 bg-slate-300">
            <div className="flex flex-row items-center justify-between gap-4">
                <EditableText
                    value={theme.name}
                    active={renaming}
                    onSubmit={submitRenameTheme}
                    onCancel={cancelRenameTheme}
                    disabled={updatingTheme || deletingTheme}
                    inputClassName="flex-1 bg-white"
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
            <List
                items={items}
                keyExtractor={item => item._id}
                direction="col"
                scroll="y"
                className="flex-1 min-h-0 gap-4"
            >
                {item => <ItemCard item={item} />}
            </List>
            <CreateItem themeId={theme._id} />
        </div>
    )
}
