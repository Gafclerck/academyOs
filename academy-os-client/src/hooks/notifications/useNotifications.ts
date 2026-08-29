import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'

import type { PaginatedResponse } from '@/lib/pagination'

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllAsRead,
  markAsRead,
  markAsUnread,
  type NotificationListParams,
} from '@/services/notifications/notificationService'

import type { AppNotification } from '@/types/notification'

type NotificationListPage = PaginatedResponse<AppNotification>

type QueriesSnapshot = [
  QueryKey,
  NotificationListPage | undefined,
][]

/* ============================================================
   QUERY KEYS
============================================================ */

export const notificationKeys = {
  all: ['notifications'] as const,

  list: (params: NotificationListParams) =>
    ['notifications', params] as const,

  unreadCount: ['unread-count'] as const,
}

/* ============================================================
   LISTE
============================================================ */

export const useNotificationList = (
  params: NotificationListParams,
) => {
  return useQuery<NotificationListPage, Error>({
    queryKey: notificationKeys.list(params),

    queryFn: () => getNotifications(params),

    // Fraîcheur : le temps réel est poussé par le WebSocket
    // (invalidation), on évite de servir un cache périmé au montage.
    staleTime: 0,
  })
}

/* ============================================================
   NOMBRE DE NON LUES
============================================================ */

export const useUnreadNotificationCount = () => {
  return useQuery<number, Error>({
    queryKey: notificationKeys.unreadCount,

    queryFn: getUnreadNotificationCount,

    staleTime: 0,
  })
}

/* ============================================================
   MARQUER COMME LUE
============================================================ */

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation<
    AppNotification,
    Error,
    string,
    QueriesSnapshot
  >({
    mutationFn: markAsRead,

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      })

      const snapshot =
        queryClient.getQueriesData<NotificationListPage>({
          queryKey: notificationKeys.all,
        })

      queryClient.setQueriesData<
        NotificationListPage
      >(
        { queryKey: notificationKeys.all },
        (current) =>
          current
            ? {
                ...current,
                results: current.results.map(
                  (item) =>
                    item.id === id
                      ? {
                          ...item,
                          is_read: true,
                          read_at:
                            item.read_at ??
                            new Date().toISOString(),
                        }
                      : item,
                ),
              }
            : current,
      )

      queryClient.setQueryData<number>(
        notificationKeys.unreadCount,
        (current) =>
          Math.max(
            0,
            (current ?? 0) - 1,
          ),
      )

      return snapshot
    },

    onError: (
      _error,
      _id,
      snapshot,
    ) => {
      if (snapshot) {
        snapshot.forEach(
          ([key, data]) =>
            queryClient.setQueryData(
              key,
              data,
            ),
        )
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      })
    },
  })
}

/* ============================================================
   MARQUER COMME NON LUE
============================================================ */

export const useMarkAsUnread = () => {
  const queryClient = useQueryClient()

  return useMutation<
    AppNotification,
    Error,
    string,
    QueriesSnapshot
  >({
    mutationFn: markAsUnread,

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      })

      const snapshot =
        queryClient.getQueriesData<NotificationListPage>({
          queryKey: notificationKeys.all,
        })

      queryClient.setQueriesData<
        NotificationListPage
      >(
        { queryKey: notificationKeys.all },
        (current) =>
          current
            ? {
                ...current,
                results: current.results.map(
                  (item) =>
                    item.id === id
                      ? {
                          ...item,
                          is_read: false,
                          read_at: null,
                        }
                      : item,
                ),
              }
            : current,
      )

      queryClient.setQueryData<number>(
        notificationKeys.unreadCount,
        (current) => (current ?? 0) + 1,
      )

      return snapshot
    },

    onError: (
      _error,
      _id,
      snapshot,
    ) => {
      if (snapshot) {
        snapshot.forEach(
          ([key, data]) =>
            queryClient.setQueryData(
              key,
              data,
            ),
        )
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      })
    },
  })
}

/* ============================================================
   MARQUER TOUTES COMME LUES
============================================================ */

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation<
    { updated_count: number },
    Error,
    void,
    QueriesSnapshot
  >({
    mutationFn: markAllAsRead,

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.all,
      })

      const snapshot =
        queryClient.getQueriesData<NotificationListPage>({
          queryKey: notificationKeys.all,
        })

      queryClient.setQueriesData<
        NotificationListPage
      >(
        { queryKey: notificationKeys.all },
        (current) =>
          current
            ? {
                ...current,
                results: current.results.map(
                  (item) => ({
                    ...item,
                    is_read: true,
                    read_at:
                      item.read_at ??
                      new Date().toISOString(),
                  }),
                ),
              }
            : current,
      )

      queryClient.setQueryData<number>(
        notificationKeys.unreadCount,
        () => 0,
      )

      return snapshot
    },

    onError: (
      _error,
      _variables,
      snapshot,
    ) => {
      if (snapshot) {
        snapshot.forEach(
          ([key, data]) =>
            queryClient.setQueryData(
              key,
              data,
            ),
        )
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      })
    },
  })
}