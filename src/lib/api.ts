import axios from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor – attach JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor – handle 401 ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => {
    // FastAPI OAuth2 wymaga URLSearchParams i klucza 'username'
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },

  register: (name: string, email: string, password: string) =>
    // Backend oczekuje 'full_name' zamiast 'name'
    api.post('/auth/register', { full_name: name, email, password }),

  me: () => api.get('/auth/me'),

  logout: () => {
    Cookies.remove('access_token')
  },
}

// ─── Events endpoints ─────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: { status?: string; page?: number }) =>
    api.get('/events', { params }),

  get: (id: string) => api.get(`/events/${id}`),

  create: (data: unknown) => api.post('/events', data),

  update: (id: string, data: unknown) => api.put(`/events/${id}`, data),

  delete: (id: string) => api.delete(`/events/${id}`),

  invite: (id: string, email: string) =>
    api.post(`/events/${id}/invite`, { email }),
}

// ─── Checklist endpoints ──────────────────────────────────────────────────────
export const checklistApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/checklist`),

  add: (eventId: string, label: string, assignedTo?: string) =>
    api.post(`/events/${eventId}/checklist`, { label, assigned_to: assignedTo }),

  toggle: (eventId: string, itemId: string) =>
    api.patch(`/events/${eventId}/checklist/${itemId}/toggle`),

  delete: (eventId: string, itemId: string) =>
    api.delete(`/events/${eventId}/checklist/${itemId}`),
}

// ─── Expenses endpoints ───────────────────────────────────────────────────────
export const expensesApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/expenses`),

  add: (eventId: string, data: unknown) =>
    api.post(`/events/${eventId}/expenses`, data),

  balances: (eventId: string) => api.get(`/events/${eventId}/expenses/balances`),
}
