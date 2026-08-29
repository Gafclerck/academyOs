import axios from 'axios'

import { tokenStore } from '@/lib/tokenStore'

import type { JwtAuthTokens } from '@/types/auth'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Requête de refresh unique et partagée : tous les appelants (intercepteur
// axios, reconnexion WebSocket) attendent la même promesse afin d'éviter
// plusieurs POST /auth/token/refresh/ simultanés.
let inFlight: Promise<string | null> | null = null

/**
 * Rafraîchit le jeton d'accès avec un single-flight partagé.
 *
 * Retourne le nouveau jeton d'accès, ou `null` si aucun refresh n'est
 * possible (pas de refresh token, ou échec). Ne lève jamais.
 */
export function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefreshToken()

  if (!refresh) {
    return Promise.resolve(null)
  }

  if (!inFlight) {
    inFlight = doRefresh(refresh).finally(() => {
      inFlight = null
    })
  }

  return inFlight
}

async function doRefresh(
  refresh: string,
): Promise<string | null> {
  try {
    const response = await axios.post<JwtAuthTokens>(
      `${API_URL}/auth/token/refresh/`,
      { refresh },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    )

    tokenStore.setTokens(response.data)

    return response.data.access
  } catch {
    return null
  }
}