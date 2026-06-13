import axios from 'axios'

const BASE_URL = 'http://localhost:8000'
const WS_URL   = 'ws://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL })

export const getRooms       = ()        => api.get('/api/rooms')
export const getMessages    = (roomId)  => api.get(`/api/messages/${roomId}`)
export const getViolations  = ()        => api.get('/api/admin/violations')
export const getStats       = ()        => api.get('/api/admin/stats')
export const resetAll       = ()        => api.delete('/api/admin/reset')

export const createWebSocket = (roomId, username) =>
  new WebSocket(`${WS_URL}/ws/${roomId}/${encodeURIComponent(username)}`)

export const deleteViolation = (id) => api.delete(`/api/admin/violations/${id}`)
