/*
  Tells the other tabs on this origin that the data changed.

  One channel object shared by sender and listener, because a BroadcastChannel
  never delivers to itself. The tab that wrote already updated its own cache and
  must not refetch on its own message.

  Other devices are a separate browser and cannot be reached this way; they
  catch up when their tab is next looked at.
*/
const channel = new BroadcastChannel('task-app-data')

// () -> void, called after any successful write
export const announceChange = () => channel.postMessage('changed')

// (handler: () -> void) -> () -> void, the unsubscribe
export const onChangeElsewhere = (handler) => {
    channel.addEventListener('message', handler)
    return () => channel.removeEventListener('message', handler)
}
