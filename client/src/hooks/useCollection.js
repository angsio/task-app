import { useQuery } from './useQuery'

/*
  useQuery specialised for the common case: a list of documents each with _id,
  kept in sync with the server locally so a write needs no refetch.

  In:  fetchFn  () -> Promise<doc[]>, each doc having an _id
       deps     array, passed straight to useQuery

  Out: { data, loading, error, refetch, upsert, remove }
       data     doc[], or null until loaded
       refetch  () -> void, reload from the server
       upsert   (...docs) -> void, adds each or replaces the one with that _id
       remove   (...docs) -> void, drops each

  Both take any number of documents and walk the list once, so a cascade or a
  batch from the agent costs one pass rather than one per document.

  Hides raw setData on purpose: these are the only cache operations the app
  needs, so no feature rewrites them.
*/
export const useCollection = (fetchFn, deps = []) => {
    const { data, setData, loading, error, refetch } = useQuery(fetchFn, deps)

    const upsert = (...docs) => setData(current => {
        const list = [...(current ?? [])]

        for (const doc of docs) {
            const at = list.findIndex(existing => existing._id === doc._id)
            if (at === -1) list.push(doc)
            else list[at] = doc
        }

        return list
    })

    const remove = (...docs) => setData(current => {
        const dropped = new Set(docs.map(doc => doc._id))
        return (current ?? []).filter(existing => !dropped.has(existing._id))
    })

    return { data, loading, error, refetch, upsert, remove }
}
