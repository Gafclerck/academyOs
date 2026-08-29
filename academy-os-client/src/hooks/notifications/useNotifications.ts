import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
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

  infinite: (params: Omit<NotificationListParams, 'page'>) =>
    ['notifications', 'infinite', params] as const,

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
   LISTE INFINIE (page complète)
============================================================ */

export const useInfiniteNotifications = (
  options: Omit<NotificationListParams, 'page'> = {},
) => {
  const pageSize = options.page_size ?? 20
  const isRead = options.is_read

  // Paramètres stables pour la clé de cache (évite les refetch
  // intempestifs si l'objet est recréé à chaque rendu).
  const params = useMemo(
    () => ({ page_size: pageSize, is_read: isRead }),
    [pageSize, isRead],
  )

  return useInfiniteQuery<NotificationListPage, Error>({
    queryKey: notificationKeys.infinite(params),

    queryFn: ({ pageParam }) =>
      getNotifications({ ...params, page: pageParam as number }),

    initialPageParam: 1,

    // `next` est une URL absolue ; on préfère déduire la page courante
    // du nombre d'éléments déjà chargés.
    getNextPageParam: (lastPage, allPages) =>
      allPages.length * pageSize < lastPage.count
        ? allPages.length + 1
        : undefined,

    placeholderData: keepPreviousData,

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