const List = (
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

    return items.map((item, index) => {
        const key = keyExtractor(item, index)
        return children(item, key, index)
    })
}

export default List