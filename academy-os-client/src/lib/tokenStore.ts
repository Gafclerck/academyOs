import type { JwtAuthTokens } from '@/types/auth'

const ACCESS_KEY = '__academy_access_token__'
const REFRESH_KEY = '__academy_refresh_token__'

let accessToken: string | null = null
let refreshToken: string | null = null

function readStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // sessionStorage indisponible
  }
}

function removeStorage(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // sessionStorage indisponible
  }
}

function init(): void {
  accessToken = readStorage(ACCESS_KEY)
  refreshToken = readStorage(REFRESH_KEY)
}

init()

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken
  },

  getRefreshToken(): string | null {
    return refreshToken
  },

  setTokens(tokens: JwtAuthTokens): void {
    accessToken = tokens.access
    refreshToken = tokens.refresh

    writeStorage(ACCESS_KEY, tokens.access)
    writeStorage(REFRESH_KEY, tokens.refresh)
  },

  setAccessToken(token: string): void {
    accessToken = token
    writeStorage(ACCESS_KEY, token)
  },

  setRefreshToken(token: string): void {
    refreshToken = token
    writeStorage(REFRESH_KEY, token)
  },

  clear(): void {
    // Mémoire
    accessToken = null
    refreshToken = null

    // SessionStorage
    removeStorage(ACCESS_KEY)
    removeStorage(REFRESH_KEY)

    // Sécurité : suppression directe au cas où
    try {
      sessionStorage.removeItem(ACCESS_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
    } catch {
      // sessionStorage indisponible
    }
  },

  hasTokens(): boolean {
    return (
      accessToken !== null &&
      refreshToken !== null
    )
  },
}