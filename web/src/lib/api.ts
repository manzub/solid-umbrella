import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({ baseURL: BASE_URL })

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const masterPassword = sessionStorage.getItem('masterPassword')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (masterPassword) config.headers['X-Master-Password'] = masterPassword
  return config
})

// Handle token expiry on every response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config

    // If 401 and we haven't already retried
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try to refresh the token
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { token } = res.data

        localStorage.setItem('token', token)
        originalRequest.headers.Authorization = `Bearer ${token}`

        // Retry the original request with new token
        return api(originalRequest)
      } catch {
        // Refresh failed — force logout
        forceLogout()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

function forceLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userId')
  sessionStorage.removeItem('masterPassword')
  // Redirect to login with a message
  window.location.href = '/login?reason=session_expired'
}

export const authApi = {
  register: (email: string, password: string, masterPassword: string) =>
    api.post('/auth/register', { email, password, masterPassword }),

  login: async (email: string, password: string, masterPassword: string) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    localStorage.setItem('userId', res.data.userId)
    sessionStorage.setItem('masterPassword', masterPassword)
    return res.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    sessionStorage.removeItem('masterPassword')
  },

  recover: (email: string, recoveryCode: string, newMasterPassword: string) =>
    api.post('/auth/recover', { email, recoveryCode, newMasterPassword })
}

export const vaultApi = {
  getAll: (params?: {
    page?: number
    search?: string
    category?: string
    date?: string
    sortKey?: string
    sortDir?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.search) query.set('search', params.search)
    if (params?.category && params.category !== 'all') query.set('category', params.category)
    if (params?.date) query.set('date', params.date)
    if (params?.sortKey) query.set('sortKey', params.sortKey)
    if (params?.sortDir) query.set('sortDir', params.sortDir)
    return api.get(`/vault?${query.toString()}`).then(r => r.data)
  },

  create: (name: string, category: string, data: Record<string, string>) =>
    api.post('/vault', {
      name, category,
      masterPassword: sessionStorage.getItem('masterPassword'),
      data
    }).then(r => r.data),

  update: async (id: string, name: string, category: string, data: Record<string, string>) => {
    const masterPassword = sessionStorage.getItem('masterPassword')
    return api.patch(`/vault/${id}`, { name, category, masterPassword, data }).then(r => r.data)
  },

  toggleFavourite: (id: string) => api.patch(`/vault/${id}/favourite`).then(r => r.data),

  export: () => api.get('/vault/export').then(r => r.data),

  delete: (id: string) => api.delete(`/vault/${id}`).then(r => r.data)
}