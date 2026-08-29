import { useEffect, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { useAuth } from '@/context/AuthContext'
import { tokenStore } from '@/lib/tokenStore'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Base du WebSocket dérivée de l'URL de l'API (http -> ws).
const WS_BASE = (() => {
  const cleaned = API_URL.replace(/\/+$/, '').replace(/\/api\/v\d+$/, '')

  if (/^https?:/.test(cleaned)) {
    return cleaned.replace(/^http/, 'ws')
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
})()

const HEARTBEAT_INTERVAL_MS = 30_000
const PONG_TIMEOUT_MS = 10_000
const MAX_RETRY_DELAY_MS = 15_000
const AUTH_REJECT_CODE = 4401

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_COUNT_KEY = ['unread-count']

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefreshToken()

  if (!refresh) {
    return null
  }

  try {
    const response = await axios.post<{ access: string }>(
      `${API_URL}/auth/token/refresh/`,
      { refresh },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    )

    tokenStore.setAccessToken(response.data.access)

    return response.data.access
  } catch {
    return null
  }
}

/**
 * Ouvre un flux WebSocket de notifications temps réel pour l'utilisateur
 * connecté et invalide les données React Query concernées à chaque événement.
 */
export const NotificationSocketProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const socketRef = useRef<WebSocket | null>(null)
  const runningRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      runningRef.current = false
      socketRef.current?.close()
      socketRef.current = null
      return
    }

    runningRef.current = true
    let retryDelay = 1_000
    let heartbeatTimer: number | undefined
    let pongTimer: number | undefined
    let pongReceived = true

    const reconcile = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    }

    const stopHeartbeat = () => {
      if (heartbeatTimer !== undefined) {
        window.clearInterval(heartbeatTimer)
        heartbeatTimer = undefined
      }
      if (pongTimer !== undefined) {
        window.clearTimeout(pongTimer)
        pongTimer = undefined
      }
    }

    const startHeartbeat = (socket: WebSocket) => {
      heartbeatTimer = window.setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          return
        }

        pongReceived = false
        socket.send(JSON.stringify({ type: 'ping' }))

        pongTimer = window.setTimeout(() => {
          if (!pongReceived) {
            socket.close()
          }
        }, PONG_TIMEOUT_MS)
      }, HEARTBEAT_INTERVAL_MS)
    }

    const scheduleRetry = (needsRefresh: boolean) => {
      window.setTimeout(() => {
        if (runningRef.current) {
          void attemptConnect(needsRefresh)
        }
      }, retryDelay)
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)
    }

    const openSocket = (token: string) => {
      const socket = new WebSocket(
        `${WS_BASE}/ws/notifications/?token=${encodeURIComponent(token)}`,
      )

      socketRef.current = socket

      socket.onopen = () => {
        retryDelay = 1_000
        // Reconciliation : récupère les événements émis pendant la coupure.
        reconcile()
        startHeartbeat(socket)
      }

      socket.onmessage = (event) => {
        let payload: { type?: string } = {}

        try {
          payload = JSON.parse(event.data as string)
        } catch {
          return
        }

        if (payload.type === 'pong') {
          pongReceived = true

          if (pongTimer !== undefined) {
            window.clearTimeout(pongTimer)
            pongTimer = undefined
          }
          return
        }

        if (payload.type === 'notification.created') {
          queryClient.invalidateQueries({
            queryKey: NOTIFICATIONS_KEY,
          })
          queryClient.invalidateQueries({
            queryKey: UNREAD_COUNT_KEY,
          })
        }
      }

      socket.onerror = () => {
        socket.close()
      }

      socket.onclose = (event) => {
        stopHeartbeat()
        socketRef.current = null

        if (!runningRef.current) {
          return
        }

        // 4401 = JWT rejeté (expiré/invalide) : tente un refresh avant reconnexion.
        scheduleRetry(event.code === AUTH_REJECT_CODE)
      }
    }

    const attemptConnect = async (needsRefresh: boolean) => {
      if (!runningRef.current) {
        return
      }

      let token = tokenStore.getAccessToken()

      if (!token) {
        scheduleRetry(false)
        return
      }

      if (needsRefresh) {
        token = (await refreshAccessToken()) ?? token
      }

      if (!runningRef.current || !token) {
        return
      }

      openSocket(token)
    }

    void attemptConnect(false)

    return () => {
      runningRef.current = false
      stopHeartbeat()
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [isAuthenticated, queryClient])

  return <>{children}</>
}