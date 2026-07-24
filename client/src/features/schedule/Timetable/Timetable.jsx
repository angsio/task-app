import { List } from '../../../components'
import { DayColumn } from './DayColumn'
import { weekDays, layoutByDay, dayKey } from './time'

const VISIBLE_DAYS = 4
const HOURS_IN_DAY = 24
const VISIBLE_HOURS = 6
const HEADER_HOURS = 0.5

const COLUMN_HEIGHT = `calc(100% * ${(HOURS_IN_DAY + HEADER_HOURS) / (VISIBLE_HOURS + HEADER_HOURS)})`
const HEADER_HEIGHT = `calc(100% * ${HEADER_HOURS / (HOURS_IN_DAY + HEADER_HOURS)})`

const DAY_LABEL = { weekday: 'short', day: 'numeric' }

const styles = {
    grid:   'bg-sky-800',
    header: 'border-b border-r border-black bg-slate-200',
}

export const Timetable = ({ themes, items }) => {
    const visibleThemes = new Set(
        themes.filter(theme => theme.visible).map(theme => theme._id)
    )

    const placedByDay = layoutByDay(items.filter(item => visibleThemes.has(item.theme)))
    const themeColor = new Map(themes.map(theme => [theme._id, theme.color]))

    return (
        <div className={`h-full w-3/4 ${styles.grid}`}>
            <List
                items={weekDays()}
                keyExtractor={dayKey}
                flow="y"
                slots={1}
                autoSize={`calc(100% / ${VISIBLE_DAYS})`}
                itemClassName=""
                className="h-full w-full overflow-auto scrollbar-none"
            >
                {day => {
                    const placed = (placedByDay.get(dayKey(day)) ?? []).map(entry => ({
                        ...entry,
                        color: themeColor.get(entry.item.theme),
                    }))

                    return (
                        <div className="h-full w-full flex flex-col" style={{ height: COLUMN_HEIGHT }}>
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