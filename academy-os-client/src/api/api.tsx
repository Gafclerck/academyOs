import axios, {
  type AxiosError,
  type AxiosRequestConfig,
} from 'axios'


import { tokenStore } from '@/lib/tokenStore'
import { refreshAccessToken } from '@/lib/refreshAccessToken'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'


const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

function redirectToLogin(): void {
  if (
    !window.location.pathname.startsWith('/login') &&
    !window.location.pathname.startsWith('/register') &&
    !window.location.pathname.startsWith('/forgot-password')
  ) {
    window.location.href = '/login'
  }
}

function handleAuthFailure(): void {
  tokenStore.clear()
  window.dispatchEvent(new Event('auth:logout'))
  redirectToLogin()
}

// ─────────────────────────────────────────────
// REQUEST INTERCEPTOR
// ─────────────────────────────────────────────

API.interceptors.request.use(
  config => {
    const token = tokenStore.getAccessToken()

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else {
      config.headers['Content-Type'] =
        'application/json'
    }

    return config
  },
)

// ─────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// ─────────────────────────────────────────────

API.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as AxiosRequestConfig & {
        _retry?: boolean
      }

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error)
    }

    // Ne jamais essayer de refresh le endpoint refresh lui-même
    if (
      originalRequest.url?.includes('/auth/token/refresh/')
    ) {
      handleAuthFailure()

      return Promise.reject(error)
    }

    // Le refresh est single-flight partagé : toutes les requêtes
    // 401 concurrentes attendent la même promesse.
    originalRequest._retry = true

    const newAccessToken = await refreshAccessToken()

    if (!newAccessToken) {
      handleAuthFailure()

      return Promise.reject(error)
    }

    if (!originalRequest.headers) {
      originalRequest.headers = {}
    }

    originalRequest.headers.Authorization =
      `Bearer ${newAccessToken}`

    return API(originalRequest)
  },
)

export default API