import { request } from './request'

export const getThemes = () => request('/themes', { 
    method: 'GET' 
})

export const createTheme = (fields) => request('/themes', {
    method: 'POST',
    body: fields,
})

export const updateTheme = (id, fields) => request(`/themes/${id}`, {
    method: 'PATCH',
    body: fields,
})

export const deleteTheme = (id) => request(`/themes/${id}`, {
    method: 'DELETE' 
})
