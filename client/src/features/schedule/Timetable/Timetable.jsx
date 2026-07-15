import { List } from '../../../components'
import { DayColumn } from './DayColumn'
import { layoutByDay, dayKey } from './time'

const VISIBLE_DAYS = 4
const HOURS_IN_DAY = 24
const VISIBLE_HOURS = 6
const HEADER_HOURS = 0.5

const COLUMN_HEIGHT = `calc(100% * ${HOURS_IN_DAY + HEADER_HOURS} / ${VISIBLE_HOURS + HEADER_HOURS})`
const HEADER_HEIGHT = `calc(100% * ${HEADER_HOURS} / ${HOURS_IN_DAY + HEADER_HOURS})`

const DAY_LABEL = { weekday: 'short', day: 'numeric' }

const weekDays = () => {
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, offset) => {
        const day = new Date(monday)
        day.setDate(monday.getDate() + offset)
        return day
    })
}

export const Timetable = ({ themes, items }) => {
    const visibleThemes = new Set(
        themes.filter(theme => theme.visible).map(theme => theme._id)
    )

    const placedByDay = layoutByDay(items.filter(item => visibleThemes.has(item.theme)))

    return (
        <div className="h-full w-3/4 bg-sky-800">
            <List
                items={weekDays()}
                keyExtractor={dayKey}
                flow="y"
                slots={1}
                autoSize={`calc(100% / ${VISIBLE_DAYS})`}
                itemClassName=""
                className="h-full w-full overflow-auto scrollbar-none"
            >
                {day => (
                    <div className="w-full flex flex-col" style={{ height: COLUMN_HEIGHT }}>
                        <div
                            className="sticky top-0 z-20 shrink-0 flex items-center justify-center border-b border-r border-black bg-slate-200"
                            style={{ height: HEADER_HEIGHT }}
                        >
                            {day.toLocaleDateString(undefined, DAY_LABEL)}
                        </div>
                        <DayColumn placed={placedByDay.get(dayKey(day)) ?? []} />
                    </div>
                )}
            </List>
        </div>
    )
}