import React from 'react'
import { Bell, Check, Clock, Mail, MailOpen } from 'lucide-react'

import type { AppNotification } from '@/types/notification'

/* =====================================================
   HELPERS
===================================================== */

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

/* =====================================================
   COMPONENT
===================================================== */

interface NotificationItemProps {
  notification: AppNotification
  onClick: () => void
  onToggleRead?: () => void
  showReadToggle?: boolean
  togglePending?: boolean
}

/**
 * Ligne de notification réutilisée par la cloche et la page complète.
 */
export const NotificationItem: React.FC<
  NotificationItemProps
> = ({
  notification,
  onClick,
  onToggleRead,
  showReadToggle = false,
  togglePending = false,
}) => {
  const rowClassName = notification.is_read
    ? 'bg-white hover:bg-slate-50 dark:bg-[#1f1f38] dark:hover:bg-white/5'
    : 'bg-[#FF6B0B]/5 hover:bg-[#FF6B0B]/10 dark:bg-[#FF6B0B]/10 dark:hover:bg-[#FF6B0B]/15'

  const iconClassName = notification.is_read
    ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-400'
    : 'bg-[#FF6B0B]/10 text-[#FF6B0B]'

  return (
    <div
      className={`w-full border-b border-slate-100 transition last:border-b-0 dark:border-white/5 ${rowClassName}`}
    >
      <div className="flex items-stretch gap-3 px-4 py-3">

        {/* BOUTON PRINCIPAL (contenu) */}

        <button
          type="button"
          onClick={onClick}
          disabled={togglePending}
          className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:opacity-60"
        >
          <div
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
          >
            {notification.is_read ? (
              <Check className="size-4" />
            ) : (
              <Bell className="size-4" />
            )}
          </div>

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
              <span>{formatDate(notification.created_at)}</span>
              <span>•</span>
              <span>{formatTime(notification.created_at)}</span>
            </div>
          </div>
        </button>

        {/* TOGGLE LU / NON LU (page complète) */}

        {showReadToggle && onToggleRead && (
          <button
            type="button"
            onClick={onToggleRead}
            disabled={togglePending}
            aria-label={
              notification.is_read
                ? 'Marquer comme non lue'
                : 'Marquer comme lue'
            }
            title={
              notification.is_read
                ? 'Marquer comme non lue'
                : 'Marquer comme lue'
            }
            className={`my-auto flex size-8 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-50 ${
              notification.is_read
                ? 'text-slate-400 hover:bg-slate-100 hover:text-[#FF6B0B] dark:hover:bg-white/5'
                : 'text-[#FF6B0B] hover:bg-[#FF6B0B]/10'
            }`}
          >
            {notification.is_read ? (
              <MailOpen className="size-4" />
            ) : (
              <Mail className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationItem