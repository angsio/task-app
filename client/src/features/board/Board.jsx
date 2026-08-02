import { useMemo } from 'react'
import { useThemes, useItems } from '../../data'
import { List } from '../../components'
import { ThemeColumn } from './ThemeColumn'
import { CreateTheme } from './CreateTheme'

const styles = {
    notice: 'text-parchment-dim',
    error:  'text-danger',
}

// Shared by every theme with no items, so an empty column keeps the same array
// between renders.
const NONE = []

export const Board = () => {
    const themes = useThemes()
    const items = useItems()

    // One pass grouped by theme, rather than filtering the whole list once per
    // column. Each column also keeps its array between renders.
    const byTheme = useMemo(() => {
        const groups = new Map()

        for (const item of items.data ?? []) {
            const group = groups.get(item.theme)
            if (group) group.push(item)
            else groups.set(item.theme, [item])
        }

        return groups
    }, [items.data])

    if (themes.error) return <p className={`p-10 ${styles.error}`}>Error: {themes.error.message}</p>
    if (items.error) return <p className={`p-10 ${styles.error}`}>Error: {items.error.message}</p>
    if (!themes.data || !items.data) return <p className={`p-10 ${styles.notice}`}>Loading...</p>

    return (
        <List
            items={themes.data}
            keyExtractor={theme => theme._id}
            across={{ base: 1, md: 2, lg: 4 }}
            visible={1}
            trailing={<CreateTheme />}
            itemClassName="p-2 snap-start snap-always md:snap-normal"
            className="h-full w-full p-2 snap-y snap-mandatory scroll-pt-2 overflow-y-auto overscroll-none"
        >
            {theme => (
                <ThemeColumn
                    theme={theme}
                    items={byTheme.get(theme._id) ?? NONE}
                />
            )}
        </List>
    )
}
