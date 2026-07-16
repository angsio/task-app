import { toHourMinute } from '../time'

export const EventCard = ({ item: event, color }) => {
    return (
        <div className="h-full w-full relative flex flex-row bg-slate-100">
            <div
                className="absolute left-0 h-full w-2 hover:w-4 transition-[width] duration-200 ease-out"
                style={{ backgroundColor: color }}
            />
            <div className="h-full w-full flex flex-col pl-6">
                <div className="text-sm truncate shrink-0 leading-6">
                    <span className="font-bold">Event: </span>{event.title}
                </div>
                <div className="flex flex-row text-sm">
                    <div className="mr-4">
                        <span className="font-bold">Starts: </span>{toHourMinute(event.timeStart)}
                    </div>
                    <div>
                        <span className="font-bold">Ends: </span>{toHourMinute(event.timeEnd)}
                    </div>
                </div>
            </div>
        </div>
    )
}