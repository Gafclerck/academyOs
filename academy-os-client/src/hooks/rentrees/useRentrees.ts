import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  getRentrees,
  createRentree,
  updateRentree,
} from '@/services/rentrees/rentreeService'

import type {
  Rentree,
  CreateRentreeDTO,
  UpdateRentreeDTO,
} from '@/types/rentree'

// ============================================================
// QUERY KEYS
// ============================================================

export const rentreeKeys = {
  all: ['rentrees'] as const,

  detail: (id: string) =>
    ['rentree', id] as const,
}

// ============================================================
// LISTE DES RENTRÉES
// ============================================================

export const useRentrees = () => {
  return useQuery<Rentree[]>({
    queryKey: rentreeKeys.all,
    queryFn: getRentrees,
  })
}

// ============================================================
// CRÉER UNE RENTRÉE
// ============================================================

export const useCreateRentree = () => {
  const queryClient = useQueryClient()

  return useMutation<
    Rentree,
    Error,
    CreateRentreeDTO
  >({
    mutationFn: createRentree,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rentreeKeys.all,
      })
    },
  })
}

// ============================================================
// MODIFIER UNE RENTRÉE
// ============================================================

export const useUpdateRentree = () => {
  const queryClient = useQueryClient()

  return useMutation<
    Rentree,
    Error,
    {
      id: string
      data: UpdateRentreeDTO
    }
  >({
    mutationFn: ({ id, data }) =>
      updateRentree(id, data),

    onSuccess: (updatedRentree) => {
      // Actualiser la liste
      queryClient.invalidateQueries({
        queryKey: rentreeKeys.all,
      })

      // Actualiser le détail
      queryClient.invalidateQueries({
        queryKey: rentreeKeys.detail(
          updatedRentree.id,
        ),
      })
    },
  })
}

export default useRentrees