import { List } from '../../../components'

const HOURS_IN_DAY = 24

const HOURS = Array.from({ length: HOURS_IN_DAY }, (_, hour) => hour)

const HOUR_HEIGHT = `calc(100% / ${HOURS_IN_DAY})`

export const DayColumn = ({ placed }) => {
    return (
        <div className="relative flex-1 min-h-0 w-full bg-violet-500">
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
                    <div className="h-full w-full flex border-b border-r border-black">
                        <div className="w-1/12 flex justify-center border-r border-black">
                            {hour}
                        </div>
                    </div>
                )}
            </List>
            <div className="absolute top-0 bottom-0 right-0 w-11/12">
                {placed.map(({ item, style }) => (
                    <div
                        key={item._id}
                        className="absolute w-full truncate bg-slate-50"
                        style={style}
                    >
                        {item.title}
                    </div>
                ))}
            </div>
        </div>
    )
}
