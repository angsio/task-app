import { useQuery } from './useQuery'

/*
  useQuery specialised for the common case: a list of documents each with _id,
  kept in sync with the server locally so a write needs no refetch.

  In:  fetchFn  () -> Promise<doc[]>, each doc having an _id
       deps     array, passed straight to useQuery

  Out: { data, loading, error, upsert, remove }
       data     doc[], or null until loaded
       upsert   (doc) -> void, adds it or replaces the one with that _id
       remove   (doc) -> void, drops the one with that _id

  Hides raw setData on purpose: upsert and remove are the only two cache
  operations the app needs, so no feature rewrites them.
*/
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