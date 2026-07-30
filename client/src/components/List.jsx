import { Fragment } from 'react'

const FLOW = {
    x: 'grid-flow-row list-tracks-x',
    y: 'grid-flow-col list-tracks-y',
}

const BREAKPOINTS = ['md', 'lg']

const toTrackVars = (name, value) => {
    const byBreakpoint = value && typeof value === 'object' ? value : { base: value }

    let carried = byBreakpoint.base
    const vars = { [`--list-${name}`]: carried }

    for (const at of BREAKPOINTS) {
        carried = byBreakpoint[at] ?? carried
        vars[`--list-${name}-${at}`] = carried
    }

    return vars
}

export const List = ({ items, keyExtractor, children, flow = 'x', slots = 1, autoSize = 'auto', className = '', itemClassName = 'p-2', trailing }) => {
    const tracks = { ...toTrackVars('slots', slots), ...toTrackVars('size', autoSize) }

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
