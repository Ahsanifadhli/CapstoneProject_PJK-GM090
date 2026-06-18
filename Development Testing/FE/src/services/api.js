import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL   = import.meta.env.VITE_WS_URL  || 'ws://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL })

// ── Rooms & Messages ──────────────────────────────────────────────────────────
export const getRooms      = ()       => api.get('/api/rooms')
export const getMessages   = (roomId) => api.get(`/api/messages/${roomId}`)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginUser     = (data)   => api.post('/api/auth/login', data)
export const registerUser  = (data)   => api.post('/api/auth/register', data)
export const getMe         = ()       => api.get('/api/auth/me', {
  headers: { Authorization: `Bearer ${sessionStorage.getItem('aishield_token') || ''}` }
})

// ── Admin Auth ────────────────────────────────────────────────────────────────
export const verifyAdmin   = (data)   => api.post('/api/admin/verify', data)

// ── Admin Data ────────────────────────────────────────────────────────────────
export const getViolations = (params) => api.get('/api/admin/violations', { params })
export const getStats      = ()       => api.get('/api/admin/stats')
export const resetAll      = ()       => api.delete('/api/admin/reset')
export const deleteViolation = (id)   => api.delete(`/api/admin/violations/${id}`)
export const getUsers      = ()       => api.get('/api/admin/users')
export const deleteUser    = (id)     => api.delete(`/api/admin/users/${id}`)

// ── Admin Review (PATCH /api/admin/violations/{id}/review) ────────────────────
// decision: "approve" | "reject"
export const reviewViolation = (id, decision) =>
  api.patch(`/api/admin/violations/${id}/review`, { decision })

// ── User: Request Review (PATCH /api/violations/{id}/request-review) ──────────
export const requestReview = (id) => api.patch(`/api/violations/${id}/request-review`)

// ── Flag & WebSocket ──────────────────────────────────────────────────────────
export const flagMessage   = (body)   => api.post('/api/flag', body)

export const createWebSocket = (roomId, username) => {
  return new WebSocket(`${WS_URL}/ws/${roomId}/${encodeURIComponent(username)}`)
}
