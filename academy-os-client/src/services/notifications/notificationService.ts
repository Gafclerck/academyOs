import api from '@/api/api'

import { normalizePaginatedResponse, type PaginatedResponse } from '@/lib/pagination'

import type {
  AppNotification,
  MarkAllAsReadResponse,
  UnreadNotificationCount,
} from '@/types/notification'

export interface NotificationListParams {
  page: number
  page_size?: number
  is_read?: boolean | string | null
}

/* ============================================================
   GET NOTIFICATIONS
============================================================ */

export const getNotifications = async (
  params: NotificationListParams,
): Promise<PaginatedResponse<AppNotification>> => {
  const response = await api.get<PaginatedResponse<AppNotification>>(
    '/notifications/',
    { params },
  )

  return normalizePaginatedResponse<AppNotification>(
    response.data,
  )
}

/* ============================================================
   GET NOMBRE DE NON LUES
============================================================ */

export const getUnreadNotificationCount =
  async (): Promise<number> => {
    const response =
      await api.get<UnreadNotificationCount>(
        '/notifications/unread-count/',
      )

    return response.data.unread_count
  }

/* ============================================================
   MARQUER COMME LUE
============================================================ */

export const markAsRead = async (
  id: string,
): Promise<AppNotification> => {
  const response = await api.patch<AppNotification>(
    `/notifications/${id}/read/`,
  )

  return response.data
}

/* ============================================================
   MARQUER COMME NON LUE
============================================================ */

export const markAsUnread = async (
  id: string,
): Promise<AppNotification> => {
  const response = await api.patch<AppNotification>(
    `/notifications/${id}/unread/`,
  )

  return response.data
}

/* ============================================================
   MARQUER TOUTES COMME LUES
============================================================ */

export const markAllAsRead = async (): Promise<
  MarkAllAsReadResponse
> => {
  const response = await api.patch<MarkAllAsReadResponse>(
    '/notifications/read-all/',
  )

  return response.data
}