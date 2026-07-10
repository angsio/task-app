import { Fragment } from 'react'

const DIRECTION = { row: 'flex-row', col: 'flex-col' }
const SCROLL = { x: 'overflow-x-auto', y: 'overflow-y-auto', both: 'overflow-auto' }

export const List = ({ items, keyExtractor, children, fallback = null, direction, wrap, scroll, className = '', trailing }) => {
    const hasItems = items && items.length > 0

    const rendered = hasItems
        ? items.map((item, index) => (
            <Fragment key={keyExtractor(item, index)}>
                {children(item, index)}
            </Fragment>
        ))
        : null

    if (!direction) {
        return hasItems ? rendered : fallback
    }

    const classes = ['flex', DIRECTION[direction], wrap && 'flex-wrap', scroll && SCROLL[scroll], className]
        .filter(Boolean)
        .join(' ')

    return (
        <div className={classes}>
            {hasItems ? rendered : fallback}
            {trailing}
        </div>
    )
}
