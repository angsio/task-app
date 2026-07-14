import { Fragment } from 'react'

const FLOW = { x: 'grid-flow-row', y: 'grid-flow-col' }

export const List = ({ items, keyExtractor, children, flow = 'x', slots = 1, autoSize = 'auto', className = '', itemClassName = 'p-2', trailing }) => {
    const tracks = flow === 'x'
        ? { gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))`, gridAutoRows: autoSize }
        : { gridTemplateRows: `repeat(${slots}, minmax(0, 1fr))`, gridAutoColumns: autoSize }

    return (
        <div className={`grid ${FLOW[flow]} ${className}`} style={tracks}>
            {items?.map((item, index) => (
                <Fragment key={keyExtractor(item, index)}>
                    <div className={itemClassName}>
                        {children(item, index)}
                    </div>
                </Fragment>
            ))}
            {trailing}
        </div>
    )
}
