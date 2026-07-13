import { Fragment } from 'react'

const FLOW = { x: 'grid-flow-row', y: 'grid-flow-col' }

export const List = ({ items, keyExtractor, children, flow = 'x', slots = 1, autoSize = 'auto', className = '', trailing }) => {
    const tracks = flow === 'x'
        ? { gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))`, gridAutoRows: autoSize }
        : { gridTemplateRows: `repeat(${slots}, minmax(0, 1fr))`, gridAutoColumns: autoSize }

    return (
        <div className={`grid ${FLOW[flow]} ${className}`} style={tracks}>
            {items?.map((item, index) => (
                <Fragment key={keyExtractor(item, index)}>
                    <div className="p-2">
                        {children(item, index)}
                    </div>
                </Fragment>
            ))}
            {trailing}
        </div>
    )
}
