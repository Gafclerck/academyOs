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

  // ─────────────────────────────────────────────
  // RÉCUPÉRER LE PROFIL
  // ─────────────────────────────────────────────

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

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────

  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<void> => {
      const newTokens =
        await loginService(credentials)

      // Sauvegarde des tokens
      tokenStore.setTokens(newTokens)

      // Mise à jour du contexte
      setTokens(newTokens)

      // Récupération de l'utilisateur connecté
      const currentUser =
        await getCurrentUserService()

      setUser(currentUser)
    },
    [],
  )

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  const logout = useCallback(
    async (): Promise<void> => {
      // Récupération du refresh token
      const refresh =
        tokenStore.getRefreshToken()

      try {
        // On informe le backend
        if (refresh) {
          await logoutService(refresh)
        }
      } catch (error) {
        /*
         * Même si le backend renvoie une erreur,
         * la session locale doit quand même être supprimée.
         */
        console.error(
          'Erreur lors de la déconnexion :',
          error,
        )
      } finally {
        // ─────────────────────────────────────
        // IMPORTANT :
        // suppression obligatoire côté frontend
        // ─────────────────────────────────────

        tokenStore.clear()

        setTokens(null)
        setUser(null)

        // Informe les autres composants
        window.dispatchEvent(
          new Event('auth:logout'),
        )
      }
    },
    [],
  )

  // ─────────────────────────────────────────────
  // RESTAURATION DE SESSION
  // ─────────────────────────────────────────────

  useEffect(() => {
    const access =
      tokenStore.getAccessToken()

    const refresh =
      tokenStore.getRefreshToken()

    // Aucun token
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
      } catch (error) {
        console.error(
          'Session invalide :',
          error,
        )

        if (!cancelled) {
          // Session invalide
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

  // ─────────────────────────────────────────────
  // ÉCOUTE LOGOUT GLOBAL
  // ─────────────────────────────────────────────

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

  // ─────────────────────────────────────────────
  // AUTHENTIFICATION
  // ─────────────────────────────────────────────

  const isAuthenticated =
    user !== null &&
    tokens !== null

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

// ─────────────────────────────────────────────
// HOOK useAuth
// ─────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth doit être utilisé dans un <AuthProvider>',
    )
  }

  return context
}