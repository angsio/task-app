import { toHourMinute } from '../time'

const styles = {
    card:  'bg-crypt border border-border rounded-sm',
    body:  'text-sm text-parchment',
    label: 'font-display text-parchment-dim',
    title: 'truncate leading-6',
}

export const EventCard = ({ item: event, color }) => {
    return (
        <div className={`relative h-full w-full flex ${styles.card}`}>
            <div
                className="absolute left-0 h-full w-2"
                style={{ backgroundColor: color }}
            />
            <div className={`h-full w-full flex flex-col pl-6 ${styles.body}`}>
                <div className={`shrink-0 ${styles.title}`}>
                    <span className={styles.label}>Event: </span>{event.title}
                </div>
                <div className="flex gap-4">
                    <div>
                        <span className={styles.label}>Starts: </span>{toHourMinute(event.timeStart)}
                    </div>
                    <div>
                        <span className={styles.label}>Ends: </span>{toHourMinute(event.timeEnd)}
                    </div>
                </div>
            </div>
        </div>
    )
}