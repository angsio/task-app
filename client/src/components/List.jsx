import { Fragment } from 'react'

export const List = (
    {
        items,
        fallback,
        keyExtractor,
        children
    }
) => {
    if (!items || items.length === 0) {
        return fallback
    }

    return items.map((item, index) => (
        <Fragment key={keyExtractor(item, index)}>
            {children(item, index)}
        </Fragment>
    ))
}