import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import {
  useInfiniteNotifications,
  useMarkAllAsRead,
  useMarkAsRead,
  useMarkAsUnread,
  useUnreadNotificationCount,
} from '@/hooks/notifications/useNotifications'

import { notificationTargetPath } from '@/lib/notificationTarget'

import { NotificationItem } from '@/pages/notifications/NotificationItem'

import type { AppNotification } from '@/types/notification'

type NotificationFilter = 'all' | 'unread'

const PAGE_SIZE = 20

/* ============================================================
   NOTIFICATIONS PAGE
============================================================ */

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()

  const [filter, setFilter] =
    useState<NotificationFilter>('all')

  const [togglingId, setTogglingId] =
    useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteNotifications({
    page_size: PAGE_SIZE,
    is_read: filter === 'unread' ? true : undefined,
  })

  const { data: unreadCountData } =
    useUnreadNotificationCount()

  const markAsReadMutation = useMarkAsRead()
  const markAsUnreadMutation = useMarkAsUnread()
  const markAllAsReadMutation = useMarkAllAsRead()

  const notifications: AppNotification[] =
    data?.pages.flatMap((page) => page.results) ?? []

  const totalCount = data?.pages[0]?.count ?? 0
  const unreadCount = unreadCountData ?? 0

  /* ==========================================================
     INFINITE SCROLL
  ========================================================== */

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          void fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  /* ==========================================================
     ACTIONS
  ========================================================== */

  const handleItemClick = (
    notification: AppNotification,
  ) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }

    const target = notificationTargetPath(notification)

    if (target) {
      navigate(target)
    }
  }

  const handleToggleRead = (
    notification: AppNotification,
  ) => {
    if (togglingId) {
      return
    }

    setTogglingId(notification.id)

    const mutation = notification.is_read
      ? markAsUnreadMutation
      : markAsReadMutation

    mutation.mutateAsync(notification.id).finally(() => {
      setTogglingId(null)
    })
  }

  const isFilterTabActive = (value: NotificationFilter) =>
    filter === value

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#FF6B0B]">
            Centre de notifications
          </p>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {unreadCount === 0
              ? 'Aucune notification non lue'
              : `${unreadCount} notification non lue${unreadCount > 1 ? 's' : ''} sur ${totalCount}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={
            unreadCount === 0 ||
            markAllAsReadMutation.isPending
          }
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-[#FF6B0B]/30 hover:text-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f38] dark:text-slate-200"
        >
          {markAllAsReadMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCheck className="size-4" />
          )}

          {markAllAsReadMutation.isPending
            ? 'Traitement...'
            : 'Tout marquer comme lu'}
        </button>
      </div>

      {/* FILTRES */}

      <div className="flex items-center gap-2">
        {(
          [
            { value: 'all', label: 'Toutes' },
            { value: 'unread', label: 'Non lues' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isFilterTabActive(tab.value)
                ? 'bg-[#FF6B0B] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            {tab.value === 'all' ? (
              <Bell className="size-4" />
            ) : (
              <BellOff className="size-4" />
            )}

            {tab.label}

            {tab.value === 'unread' &&
              unreadCount > 0 && (
                <span className="rounded-full bg-[#FF6B0B]/15 px-1.5 text-[11px] font-bold text-[#FF6B0B]">
                  {unreadCount}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* CHARGEMENT INITIAL */}

      {isLoading && (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
          <Loader2 className="size-8 animate-spin text-[#FF6B0B]" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chargement des notifications...
          </p>
        </div>
      )}

      {/* ERREUR */}

      {!isLoading && isError && (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <Bell className="size-7" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
            Impossible de charger les notifications
          </h3>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#FF6B0B]/30 hover:text-[#FF6B0B] dark:border-white/10 dark:text-slate-200"
          >
            <RefreshCw className="size-3.5" />
            Réessayer
          </button>
        </div>
      )}

      {/* LISTE */}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
          {notifications.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
                <Inbox className="size-7" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
                {filter === 'unread'
                  ? 'Aucune notification non lue'
                  : 'Vous êtes à jour'}
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {filter === 'unread'
                  ? 'Toutes vos notifications ont été lues.'
                  : "Vous n'avez aucune notification pour le moment."}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() =>
                    handleItemClick(notification)
                  }
                  onToggleRead={() =>
                    handleToggleRead(notification)
                  }
                  showReadToggle
                  togglePending={
                    togglingId === notification.id
                  }
                />
              ))}

              {/* Sentinelle pour le chargement infini */}

              <div ref={sentinelRef} className="h-px w-full" />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="size-4 animate-spin text-[#FF6B0B]" />
                  Chargement...
                </div>
              )}

              {!hasNextPage && (
                <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-5 text-xs text-slate-400 dark:border-white/5">
                  <CheckCircle2 className="size-3.5" />
                  Vous avez tout vu
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage