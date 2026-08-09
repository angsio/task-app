const channel = new BroadcastChannel('task-app-data')

// () -> void, called after any successful write
export const announceChange = () => channel.postMessage('changed')

// (handler: () -> void) -> () -> void, the unsubscribe
export const onChangeElsewhere = (handler) => {
    channel.addEventListener('message', handler)
    return () => channel.removeEventListener('message', handler)
}
