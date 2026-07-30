import { useBreakpoint } from '../hooks'

const FLOW = { x: 'grid-flow-row', y: 'grid-flow-col' }

const ORDER = ['base', 'md', 'lg']

// Read a count that may vary by screen: 4, or { base: 2, md: 3, lg: 4 }.
// An unnamed breakpoint keeps the value from the one below it.
const countAt = (count, breakpoint) => {
    if (typeof count !== 'object') return count

    const reachable = ORDER.slice(0, ORDER.indexOf(breakpoint) + 1)

    return reachable.reduce((chosen, at) => count[at] ?? chosen, undefined)
}

/*
  A scrolling grid. The caller says which way items flow and how many fit;
  List does the track maths.

    items    array. keyExtractor(item) -> key, children(item) -> the cell.
    flow     'x' fills rows then wraps | 'y' fills columns then wraps.
    across   tracks on the fixed cross axis (flow 'x' -> columns). Default 1.
    visible  items along the flow axis before it overflows and scrolls.
             Omit for content-sized tracks.

  across/visible take a count, or { base, md, lg } to change per breakpoint.
  Assumes no grid gap; item spacing belongs on itemClassName.

    <List items={themes} keyExtractor={t => t._id} across={{ base: 1, lg: 4 }} visible={1}>
      {theme => <ThemeColumn theme={theme} />}
    </List>

  className styles the grid box, itemClassName every cell. trailing is one
  extra cell after the items, wrapped like the rest.
*/
export const List = ({ items, keyExtractor, children, flow = 'x', across = 1, visible, className = '', itemClassName = '', trailing }) => {
    const breakpoint = useBreakpoint()

    const lanes = countAt(across, breakpoint)
    const size = visible ? `calc(100% / ${countAt(visible, breakpoint)})` : 'auto'

    const tracks = flow === 'x'
        ? { gridTemplateColumns: `repeat(${lanes}, minmax(0, 1fr))`, gridAutoRows: size }
        : { gridTemplateRows: `repeat(${lanes}, minmax(0, 1fr))`, gridAutoColumns: size }

    return (
        <div className={`grid ${FLOW[flow]} ${className}`} style={tracks}>
            {items.map(item => (
                <div key={keyExtractor(item)} className={itemClassName}>
                    {children(item)}
                </div>
            ))}
            {trailing && <div className={itemClassName}>{trailing}</div>}
        </div>
    )
}
