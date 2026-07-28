import { request } from './request'

export const getItems = (filters = {}) => {
    const defined = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value != null)
    )
    const query = new URLSearchParams(defined).toString()

    return request(query ? `/items?${query}` : '/items', {
        method: 'GET'
    })
}

export const createItem = (fields) => request('/items', {
    method: 'POST',
    body: fields,
})

export const updateItem = (id, fields) => request(`/items/${id}`, {
    method: 'PATCH',
    body: fields,
})

export const deleteItem = (id) => request(`/items/${id}`, {
    method: 'DELETE'
})