import { List } from '../../../components'
import { TaskCard, ReminderCard, EventCard } from './ItemCards'

const HOURS_IN_DAY = 24

const HOURS = Array.from({ length: HOURS_IN_DAY }, (_, hour) => hour)

const HOUR_HEIGHT = `calc(100% / ${HOURS_IN_DAY})`

const ITEM_CARDS = { Task: TaskCard, Event: EventCard, Reminder: ReminderCard }

export const DayColumn = ({ placed }) => {
    return (
        <div className="relative h-full w-full bg-indigo-950">
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
                    <div className="h-full w-full flex border-b border-r border-white">
                        <div className="h-full w-1/12 flex justify-center border-r border-white text-white font-bold">
                            {hour}
                        </div>
                    </div>
                )}
            </List>
            <div className="absolute top-0 right-0 h-full w-11/12">
                {placed.map(({ item, style }) => {
                    const Card = ITEM_CARDS[item.itemType]

                    return (
                        <div
                            key={item._id}
                            className="absolute w-full truncate"
                            style={style}
                        >
                            {Card ? <Card item={item} /> : null}
                        </div>
                    )}
                )}
            </div>
        </div>
    )
}
