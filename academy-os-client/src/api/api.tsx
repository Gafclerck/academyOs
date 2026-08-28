import axios, {
  type AxiosError,
  type AxiosRequestConfig,
} from 'axios'


import { tokenStore } from '@/lib/tokenStore'
import type { JwtAuthTokens } from '@/types/auth'

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

let isRefreshing = false

type QueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let failedQueue: QueueItem[] = []

function processQueue(
  error: unknown,
  token: string | null,
): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })

  failedQueue = []
}

function redirectToLogin(): void {
  if (
    !window.location.pathname.startsWith('/login') &&
    !window.location.pathname.startsWith('/register') &&
    !window.location.pathname.startsWith('/forgot-password')
  ) {
    window.location.href = '/login'
  }
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
      tokenStore.clear()
      window.dispatchEvent(new Event('auth:logout'))
      redirectToLogin()

      return Promise.reject(error)
    }

    const storedRefreshToken = tokenStore.getRefreshToken()

    if (!storedRefreshToken) {
      tokenStore.clear()
      window.dispatchEvent(new Event('auth:logout'))
      redirectToLogin()

      return Promise.reject(error)
    }

    // ─────────────────────────────────────────
    // Une autre requête est déjà en train de refresh
    // ─────────────────────────────────────────

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            if (!originalRequest.headers) {
              originalRequest.headers = {}
            }

            originalRequest.headers.Authorization =
              `Bearer ${newToken}`

            resolve(API(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const response = await axios.post<JwtAuthTokens>(
        `${API_URL}/auth/token/refresh/`,
        {
          refresh: storedRefreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )

      const newTokens = response.data

      tokenStore.setTokens(newTokens)

      processQueue(null, newTokens.access)

      if (!originalRequest.headers) {
        originalRequest.headers = {}
      }

      originalRequest.headers.Authorization =
        `Bearer ${newTokens.access}`

      return API(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)

      tokenStore.clear()

      window.dispatchEvent(new Event('auth:logout'))

      redirectToLogin()

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default API