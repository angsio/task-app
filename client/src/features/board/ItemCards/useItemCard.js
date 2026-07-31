import { useState } from 'react'

import { updateItem, deleteItem } from '../../../api'
import { useMutation } from '../../../hooks'
import { useBoardContext } from '../BoardContext'

/*
  Everything every item card does regardless of its type: rename it, delete it,
  and patch one of its own fields.

  In:  item  the item document this card renders

  Out: { renaming, startRename, submitRename, cancelRename, runDelete, patch, busy }
       renaming      boolean, whether the title is being edited
       startRename   () -> void
       submitRename  (title: string) -> Promise<void>. An empty title cancels;
                     a failed write keeps the field open with the user's text.
       cancelRename  () -> void
       runDelete     () -> Promise<void>
       patch         (fields: object) -> Promise<void>, for the type-specific
                     body: a deadline, a completed flag, a start time
       busy          boolean, true while any of the above is in flight

  Only the shared BEHAVIOUR lives here. Each card still writes its own layout
  top to bottom, which is the readability the triplication was for.
*/
export const useItemCard = (item) => {
    const [renaming, setRenaming] = useState(false)

    const { mutate: updateItemMutation, loading: updating } = useMutation(updateItem)
    const { mutate: deleteItemMutation, loading: deleting } = useMutation(deleteItem)

    const { upsertItem, removeItem } = useBoardContext()

    const patch = async (fields) => {
        const updated = await updateItemMutation(item._id, fields)
        if (!updated) return

        upsertItem(updated)
    }

    const submitRename = async (title) => {
        if (!title.trim()) {
            setRenaming(false)
            return
        }

        const updated = await updateItemMutation(item._id, { title })
        if (!updated) return

        upsertItem(updated)
        setRenaming(false)
    }

    const runDelete = async () => {
        const deleted = await deleteItemMutation(item._id)
        if (!deleted) return

        removeItem(deleted)
    }

    return {
        renaming,
        startRename: () => setRenaming(true),
        submitRename,
        cancelRename: () => setRenaming(false),
        runDelete,
        patch,
        busy: updating || deleting,
    }
}
