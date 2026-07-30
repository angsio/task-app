import { List } from '../../../components'
import { DayColumn } from './DayColumn'
import { weekDays, layoutByDay, dayKey } from './time'

const VISIBLE_DAYS = { base: 1, md: 2, lg: 4 }
const HOURS_IN_DAY = 24
const VISIBLE_HOURS = 6
const HEADER_HOURS = 0.5

const DAY_WIDTH = Object.fromEntries(
    Object.entries(VISIBLE_DAYS).map(([at, days]) => [at, `calc(100% / ${days})`])
)

const COLUMN_HEIGHT = `calc(100% * ${(HOURS_IN_DAY + HEADER_HOURS) / (VISIBLE_HOURS + HEADER_HOURS)})`
const HEADER_HEIGHT = `calc(100% * ${HEADER_HOURS / (HOURS_IN_DAY + HEADER_HOURS)})`

const DAY_LABEL = { weekday: 'short', day: 'numeric' }

const styles = {
    grid:   'bg-void',
    header: 'border-b border-r border-border bg-obsidian font-display text-parchment-dim',
}

export const Timetable = ({ themes, items }) => {
    const visibleThemes = new Set(
        themes.filter(theme => theme.visible).map(theme => theme._id)
    )

    const placedByDay = layoutByDay(items.filter(item => visibleThemes.has(item.theme)))
    const themeColor = new Map(themes.map(theme => [theme._id, theme.color]))

    return (
        <div className={`h-3/5 w-full lg:h-full lg:w-3/4 ${styles.grid}`}>
            <List
                items={weekDays()}
                keyExtractor={dayKey}
                flow="y"
                slots={1}
                autoSize={DAY_WIDTH}
                itemClassName="snap-start snap-always"
                className="h-full w-full snap-x snap-mandatory md:snap-none overflow-auto overscroll-none scrollbar-none"
            >
                {day => {
                    const placed = (placedByDay.get(dayKey(day)) ?? []).map(entry => ({
                        ...entry,
                        color: themeColor.get(entry.item.theme),
                    }))

                    return (
                        <div className="w-full flex flex-col" style={{ height: COLUMN_HEIGHT }}>
                            <div
                                className={`sticky top-0 z-1 flex items-center justify-center ${styles.header}`}
                                style={{ height: HEADER_HEIGHT }}
                            >
                                {day.toLocaleDateString(undefined, DAY_LABEL)}
                            </div>
                            <DayColumn placed={placed} />
                        </div>
                    )
                }}
            </List>
        </div>
    )
}