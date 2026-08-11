import { request } from './request'

// (messages: message[], approved?: boolean) -> Promise<{ messages, pending, documents, removed }>
// Pass `approved` only when answering a pending confirmation. The browser's
// timezone rides along so the agent talks in the user's own clock rather than
// the server's.
export const sendTurn = (messages, approved) => request('/agent', {
    method: 'POST',
    body: { messages, approved, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
})
