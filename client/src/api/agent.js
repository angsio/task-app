import { request } from './request'

// (messages: message[], approved?: boolean) -> Promise<{ messages, pending, documents }>
// Pass `approved` only when answering a pending confirmation.
export const sendTurn = (messages, approved) => request('/agent', {
    method: 'POST',
    body: { messages, approved }
})
