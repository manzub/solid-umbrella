import axios from 'axios'

const BASE_URL = 'http://localhost:3000'

const api = axios.create({ baseURL: BASE_URL })

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const masterPassword = sessionStorage.getItem('masterPassword')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (masterPassword) config.headers['X-Master-Password'] = masterPassword
  return config
})

export const authApi = {
  register: (email: string, password: string, masterPassword: string) =>
    api.post('/auth/register', { email, password, masterPassword }),

  login: async (email: string, password: string, masterPassword: string) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userId', res.data.userId)
    sessionStorage.setItem('masterPassword', masterPassword) // cleared when tab closes
    return res.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    sessionStorage.removeItem('masterPassword')
  }
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
      name,
      category,
      masterPassword: sessionStorage.getItem('masterPassword'),
      data
    }).then(r => r.data),

  update: async (id: string, name: string, category: string, data: Record<string, string>) => {
    const masterPassword = sessionStorage.getItem('masterPassword') // web
    return api.patch(`/vault/${id}`, { name, category, masterPassword, data }).then(r => r.data)
  },

  delete: (id: string) => api.delete(`/vault/${id}`).then(r => r.data)
}