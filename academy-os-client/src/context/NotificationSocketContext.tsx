import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { notificationKeys } from '@/hooks/notifications/useNotifications'
import { refreshAccessToken } from '@/lib/refreshAccessToken'
import { tokenStore } from '@/lib/tokenStore'

import { useAuth } from '@/context/AuthContext'

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
const INVALIDATE_DEBOUNCE_MS = 800
const AUTH_REJECT_CODE = 4401

type SocketStatus = 'connecting' | 'connected' | 'offline'

interface NotificationSocketValue {
  status: SocketStatus
}

const NotificationSocketContext =
  createContext<NotificationSocketValue | null>(null)

/**
 * État de la connexion temps réel. Peut être utilisé par la cloche
 * ou la future page de notifications.
 */
export function useNotificationSocket(): NotificationSocketValue {
  const context = useContext(NotificationSocketContext)

  if (context === null) {
    throw new Error(
      'useNotificationSocket doit être utilisé sous NotificationSocketProvider.',
    )
  }

  return context
}

/**
 * Ouvre un flux WebSocket de notifications temps réel pour l'utilisateur
 * connecté et invalide les données React Query concernées à chaque événement.
 * Les invalidation sont débouncées pour coalescer les rafales ; en revanche
 * la réconciliation au (re)connect est immédiate pour combler les trous.
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
  const invalidateTimerRef = useRef<number | undefined>(undefined)

  const [status, setStatus] = useState<SocketStatus>(
    'connecting',
  )

  const reconcile = useCallback(() => {
    if (!runningRef.current) {
      return
    }

    queryClient.invalidateQueries({
      queryKey: notificationKeys.all,
    })
    queryClient.invalidateQueries({
      queryKey: notificationKeys.unreadCount,
    })
  }, [queryClient])

  const scheduleReconcile = useCallback(() => {
    if (invalidateTimerRef.current !== undefined) {
      window.clearTimeout(invalidateTimerRef.current)
    }

    invalidateTimerRef.current = window.setTimeout(
      reconcile,
      INVALIDATE_DEBOUNCE_MS,
    )
  }, [reconcile])

  useEffect(() => {
    if (!isAuthenticated) {
      runningRef.current = false
      socketRef.current?.close()
      socketRef.current = null
      return
    }

    runningRef.current = true
    setStatus('connecting')

    let retryDelay = 1_000
    let heartbeatTimer: number | undefined
    let pongTimer: number | undefined
    let pongReceived = true

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
        setStatus('connected')
        // Réconciliation : récupère les événements émis pendant la coupure.
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
          scheduleReconcile()
        }
      }

      socket.onerror = () => {
        socket.close()
      }

      socket.onclose = (event) => {
        stopHeartbeat()
        socketRef.current = null
        setStatus('offline')

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

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        runningRef.current &&
        (!socketRef.current ||
          socketRef.current.readyState !== WebSocket.OPEN)
      ) {
        retryDelay = 1_000
        void attemptConnect(false)
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    void attemptConnect(false)

    return () => {
      runningRef.current = false

      if (invalidateTimerRef.current !== undefined) {
        window.clearTimeout(invalidateTimerRef.current)
        invalidateTimerRef.current = undefined
      }

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )

      stopHeartbeat()
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [isAuthenticated, reconcile, scheduleReconcile])

  const value = useMemo(
    () => ({ status }),
    [status],
  )

  return (
    <NotificationSocketContext.Provider value={value}>
      {children}
    </NotificationSocketContext.Provider>
  )
}