import { useQuery } from './useQuery'

export const useCollection = (fetchFn, deps) => {
    const { data, setData, loading, error } = useQuery(fetchFn, deps)

    const upsert = (doc) => setData(current => {
        const list = current ?? []
        const exists = list.some(existing => existing._id === doc._id)
        return exists
            ? list.map(existing => existing._id === doc._id ? doc : existing)
            : [...list, doc]
    })

    const remove = (doc) => setData(current =>
        (current ?? []).filter(existing => existing._id !== doc._id)
    )

    return { data, loading, error, upsert, remove }
}
