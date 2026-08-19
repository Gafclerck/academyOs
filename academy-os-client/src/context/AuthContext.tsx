import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import type {
  AuthContextType,
  JwtAuthTokens,
  User,
  LoginCredentials,
} from '@/types/auth'

import {
  getCurrentUserService,
} from '@/services/auth/currentUser'

import {
  loginService,
} from '@/services/auth/login'

import {
  logoutService,
} from '@/services/auth/logout'

import { tokenStore } from '@/lib/tokenStore'

export const AuthContext =
  createContext<AuthContextType | null>(null)

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [user, setUser] =
    useState<User | null>(null)

  const [tokens, setTokens] =
    useState<JwtAuthTokens | null>(null)

  const [loading, setLoading] =
    useState<boolean>(true)

  const refreshUserProfile =
    useCallback(async (): Promise<User | null> => {
      try {
        const currentUser =
          await getCurrentUserService()

        setUser(currentUser)

        return currentUser
      } catch {
        setUser(null)

        return null
      }
    }, [])

  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<void> => {
      const newTokens =
        await loginService(credentials)

      tokenStore.setTokens(newTokens)
      setTokens(newTokens)

      const currentUser =
        await getCurrentUserService()

      setUser(currentUser)
    },
    [],
  )

  const logout = useCallback(
    async (): Promise<void> => {
      const refresh =
        tokenStore.getRefreshToken()

      try {
        if (refresh) {
          await logoutService(refresh)
        }
      } catch {
        // Même si l'API refuse le logout,
        // on doit supprimer la session locale.
      } finally {
        tokenStore.clear()
        setTokens(null)
        setUser(null)
      }
    },
    [],
  )

  useEffect(() => {
    const access =
      tokenStore.getAccessToken()

    const refresh =
      tokenStore.getRefreshToken()

    if (!access || !refresh) {
      setLoading(false)
      return
    }

    let cancelled = false

    const restoreSession = async () => {
      try {
        const currentUser =
          await getCurrentUserService()

        if (!cancelled) {
          setUser(currentUser)
          setTokens({
            access,
            refresh,
          })
        }
      } catch {
        if (!cancelled) {
          tokenStore.clear()
          setUser(null)
          setTokens(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleAuthLogout = () => {
      tokenStore.clear()
      setUser(null)
      setTokens(null)
    }

    window.addEventListener(
      'auth:logout',
      handleAuthLogout,
    )

    return () => {
      window.removeEventListener(
        'auth:logout',
        handleAuthLogout,
      )
    }
  }, [])

  const isAuthenticated =
    user !== null && tokens !== null

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth doit être utilisé dans un <AuthProvider>',
    )
  }

  return context
}