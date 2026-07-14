import { List } from '../../../components'
import { DayColumn } from './DayColumn'
import { groupByDay, dayKey } from './time'

const VISIBLE_DAYS = 4

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

    const itemsByDay = groupByDay(items.filter(item => visibleThemes.has(item.theme)))

    return (
        <div className="h-full w-3/4 bg-sky-800">
            <List
                items={weekDays()}
                keyExtractor={dayKey}
                flow="y"
                slots={1}
                autoSize={`calc(100% / ${VISIBLE_DAYS})`}
                itemClassName="p-1"
                className="h-full w-full overflow-auto scrollbar-none p-1"
            >
                {day => (
                    <DayColumn
                        day={day}
                        items={itemsByDay.get(dayKey(day)) ?? []}
                    />
                )}
            </List>
        </div>
    )
}