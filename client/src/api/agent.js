import { request } from './request'

export const sendPrompt = (prompt) => request('/agent', {
    method: 'POST',
    body: { prompt }
})
