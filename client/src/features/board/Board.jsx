import { useCollection } from '../../hooks'
import { getThemes, getItems } from '../../api'
import { List } from '../../components'
import { BoardProvider } from './BoardContext'
import { ThemeColumn } from './ThemeColumn'
import { CreateTheme } from './CreateTheme'

const styles = {
    notice: 'text-parchment-dim',
    error:  'text-danger',
}

export const Board = () => {
    const themes = useCollection(getThemes)
    const items = useCollection(getItems)

    if (themes.error) return <p className={`p-10 ${styles.error}`}>Error: {themes.error.message}</p>
    if (items.error) return <p className={`p-10 ${styles.error}`}>Error: {items.error.message}</p>
    if (!themes.data || !items.data) return <p className={`p-10 ${styles.notice}`}>Loading...</p>

    return (
        <BoardProvider value={{
            upsertTheme: themes.upsert,
            removeTheme: themes.remove,
            upsertItem: items.upsert,
            removeItem: items.remove,
        }}>
            <List
                items={themes.data}
                keyExtractor={theme => theme._id}
                flow="x"
                slots={4}
                autoSize="100%"
                trailing=
                {
                    <div className="p-2">
                        <CreateTheme />
                    </div>
                }
                className="h-full w-full p-2 overflow-y-auto overscroll-none"
            >
                {theme => (
                    <ThemeColumn
                        theme={theme}
                        items={items.data.filter(item => item.theme === theme._id)}
                    />
                )}
            </List>
        </BoardProvider>
    )
}