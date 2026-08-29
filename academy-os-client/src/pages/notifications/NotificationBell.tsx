import React, { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import API from '@/api/api'

// =====================================================
// TYPES
// =====================================================

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  is_read: boolean
  read_at: string | null
  content_type: number | null
  object_id: string | null
  created_at: string
}

interface NotificationsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Notification[]
}

interface UnreadCountResponse {
  unread_count: number
}

// =====================================================
// HELPERS
// =====================================================

const formatDate = (date: string) => {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return date
  }

  return value.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatTime = (date: string) => {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return ''
  }

  return value.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// =====================================================
// COMPONENT
// =====================================================

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([])

  const [unreadCount, setUnreadCount] = useState(0)

  const [open, setOpen] = useState(false)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // =====================================================
  // CHARGER LES NOTIFICATIONS
  // =====================================================

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError(false)

      const response =
        await API.get<NotificationsResponse>(
          '/notifications/',
          {
            params: {
              page: 1,
              page_size: 10,
            },
          },
        )

      setNotifications(
        Array.isArray(response.data?.results)
          ? response.data.results
          : [],
      )
    } catch (error) {
      console.error(
        'Erreur lors du chargement des notifications :',
        error,
      )

      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // CHARGER LE NOMBRE DE NOTIFICATIONS NON LUES
  // =====================================================

  const loadUnreadCount = async () => {
    try {
      const response =
        await API.get<UnreadCountResponse>(
          '/notifications/unread-count/',
        )

      setUnreadCount(
        response.data?.unread_count ?? 0,
      )
    } catch (error) {
      console.error(
        'Erreur lors du chargement du nombre de notifications :',
        error,
      )
    }
  }

  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================

  useEffect(() => {
    void loadNotifications()
    void loadUnreadCount()

    const interval = window.setInterval(() => {
      void loadNotifications()
      void loadUnreadCount()
    }, 30000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  // =====================================================
  // CHARGER LES NOTIFICATIONS À L'OUVERTURE
  // =====================================================

  useEffect(() => {
    if (open) {
      void loadNotifications()
      void loadUnreadCount()
    }
  }, [open])

  // =====================================================
  // FERMER EN CLIQUANT À L'EXTÉRIEUR
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      )
    }
  }, [])

  // =====================================================
  // MARQUER UNE NOTIFICATION COMME LUE
  // =====================================================

  const markAsRead = async (
    notification: Notification,
  ) => {
    if (notification.is_read) {
      return
    }

    try {
      await API.patch(
        `/notifications/${notification.id}/read/`,
      )

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item,
        ),
      )

      setUnreadCount((current) =>
        Math.max(0, current - 1),
      )
    } catch (error) {
      console.error(
        'Erreur lors du marquage de la notification :',
        error,
      )
    }
  }

  // =====================================================
  // MARQUER TOUTES LES NOTIFICATIONS COMME LUES
  // =====================================================

  const markAllAsRead = async () => {
    if (unreadCount === 0 || loading) {
      return
    }

    try {
      setLoading(true)

      await API.post('/notifications/read-all/')

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at:
            notification.read_at ??
            new Date().toISOString(),
        })),
      )

      setUnreadCount(0)
    } catch (error) {
      console.error(
        'Erreur lors du marquage des notifications :',
        error,
      )
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // OUVRIR UNE NOTIFICATION
  // =====================================================

  const handleNotificationClick = async (
    notification: Notification,
  ) => {
    await markAsRead(notification)

    // Plus tard, on pourra rediriger selon
    // notification_type / object_id.
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      {/* =================================================
          BOUTON CLOCHE
      ================================================= */}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Bell className="size-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B0B] px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}
      </button>

      {/* =================================================
          DROPDOWN
      ================================================= */}

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#1f1f38]">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {unreadCount === 0
                  ? 'Aucune notification non lue'
                  : `${unreadCount} notification${
                      unreadCount > 1
                        ? 's'
                        : ''
                    } non lue${
                      unreadCount > 1
                        ? 's'
                        : ''
                    }`}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#FF6B0B] transition hover:bg-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" />

                {loading
                  ? 'Traitement...'
                  : 'Tout lire'}
              </button>
            )}
          </div>

          {/* =================================================
              CHARGEMENT
          ================================================= */}

          {loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-10">
              <RefreshCw className="size-6 animate-spin text-[#FF6B0B]" />

              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Chargement des notifications...
              </p>
            </div>
          )}

          {/* =================================================
              ERREUR
          ================================================= */}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">

              <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertCircle className="size-5" />
              </div>

              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                Impossible de charger les notifications
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadNotifications()
                  void loadUnreadCount()
                }}
                className="mt-3 text-xs font-semibold text-[#FF6B0B] hover:underline"
              >
                Réessayer
              </button>

            </div>
          )}

          {/* =================================================
              AUCUNE NOTIFICATION
          ================================================= */}

          {!loading &&
            !error &&
            notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">

                <div className="flex size-11 items-center justify-center rounded-full bg-[#FF6B0B]/10 text-[#FF6B0B]">
                  <Bell className="size-5" />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Vous êtes à jour
                </p>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Vous n'avez aucune notification pour le moment.
                </p>

              </div>
            )}

          {/* =================================================
              LISTE DES NOTIFICATIONS
          ================================================= */}

          {notifications.length > 0 && (
            <div className="max-h-[420px] overflow-y-auto">

              {notifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      void handleNotificationClick(
                        notification,
                      )
                    }
                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 dark:border-white/5 ${
                      notification.is_read
                        ? 'bg-white hover:bg-slate-50 dark:bg-[#1f1f38] dark:hover:bg-white/5'
                        : 'bg-[#FF6B0B]/5 hover:bg-[#FF6B0B]/10 dark:bg-[#FF6B0B]/10 dark:hover:bg-[#FF6B0B]/15'
                    }`}
                  >

                    <div className="flex gap-3">

                      {/* ICÔNE */}

                      <div
                        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                          notification.is_read
                            ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-400'
                            : 'bg-[#FF6B0B]/10 text-[#FF6B0B]'
                        }`}
                      >
                        {notification.is_read ? (
                          <Check className="size-4" />
                        ) : (
                          <Bell className="size-4" />
                        )}
                      </div>

                      {/* CONTENU */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <p
                            className={`text-sm ${
                              notification.is_read
                                ? 'font-medium text-slate-700 dark:text-slate-200'
                                : 'font-bold text-slate-900 dark:text-white'
                            }`}
                          >
                            {notification.title}
                          </p>

                          {!notification.is_read && (
                            <span className="mt-1 size-2 shrink-0 rounded-full bg-[#FF6B0B]" />
                          )}

                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">

                          <Clock className="size-3" />

                          <span>
                            {formatDate(
                              notification.created_at,
                            )}
                          </span>

                          <span>•</span>

                          <span>
                            {formatTime(
                              notification.created_at,
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                  </button>
                ),
              )}

            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5 text-center dark:border-white/10">

              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  // Navigation vers une future page
                  // complète des notifications.
                }}
                className="text-xs font-semibold text-[#FF6B0B] transition hover:underline"
              >
                Voir toutes les notifications
              </button>

            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default NotificationBell

