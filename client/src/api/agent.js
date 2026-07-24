import { request } from './request'

export const sendMessages = (messages) => request('/agent', {
    method: 'POST',
    body: { messages }
})

export const resolveActions = (messages, approved) => request('/agent/confirm', {
    method: 'POST',
    body: { messages, approved }
})
