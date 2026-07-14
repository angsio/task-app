import { List } from '../../../components'
import { dayPosition } from './time'

const HOURS_IN_DAY = 24
const VISIBLE_HOURS = 6

const HOURS = Array.from({ length: HOURS_IN_DAY }, (_, hour) => hour)

const DAY_HEIGHT = `calc(100% * ${HOURS_IN_DAY} / ${VISIBLE_HOURS})`
const HOUR_HEIGHT = `calc(100% / ${HOURS_IN_DAY})`

const DAY_LABEL = { weekday: 'short', day: 'numeric' }

export const DayColumn = ({ day, items }) => {
    return (
        <div className="relative w-full bg-violet-500" style={{ height: DAY_HEIGHT }}>
            <List
                items={HOURS}
                keyExtractor={hour => hour}
                flow="x"
                slots={1}
                autoSize={HOUR_HEIGHT}
                itemClassName=""
                className="h-full w-full"
            >
                {hour => (
                    <div className="h-full w-full border-b border-black">
                        {hour === 0 && day.toLocaleDateString(undefined, DAY_LABEL)}
                    </div>
                )}
            </List>
            {items.map(item => (
                <div
                    key={item._id}
                    className="absolute w-full truncate bg-slate-50"
                    style={dayPosition(item)}
                >
                    {item.title}
                </div>
            ))}
        </div>
    )
}
