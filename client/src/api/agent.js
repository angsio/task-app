import { request } from './request'

export const sendPrompt = (prompt) => request('/agent', {
    method: 'POST',
    body: { prompt }
})

export const executeActions = (actions) => request('/agent/execute', {
    method: 'POST',
    body: { actions }
})
