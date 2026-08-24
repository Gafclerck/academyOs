import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  getCohortes,
  getCohorteById,
  createCohorte,
  updateCohorte,
} from '@/services/cohortes/cohorteService'

import type {
  Cohorte,
  CreateCohorteDTO,
  UpdateCohorteDTO,
} from '@/types/cohorte'

/* ============================================================
   QUERY KEYS
============================================================ */

export const cohorteKeys = {
  all: ['cohortes'] as const,

  detail: (id: string) =>
    ['cohortes', id] as const,
}

/* ============================================================
   LISTE
============================================================ */

export const useCohortes = () => {
  return useQuery<Cohorte[], Error>({
    queryKey: cohorteKeys.all,
    queryFn: getCohortes,
  })
}

/* ============================================================
   DÉTAIL
============================================================ */

export const useCohorte = (id?: string) => {
  return useQuery<Cohorte, Error>({
    queryKey: id
      ? cohorteKeys.detail(id)
      : ['cohortes', 'empty'],

    queryFn: () => {
      if (!id) {
        throw new Error(
          'Identifiant de cohorte manquant.',
        )
      }

      return getCohorteById(id)
    },

    enabled: Boolean(id),

    retry: false,
  })
}

/* ============================================================
   CRÉER
============================================================ */

export const useCreateCohorte = () => {
  const queryClient = useQueryClient()

  return useMutation<
    Cohorte,
    Error,
    CreateCohorteDTO
  >({
    mutationFn: createCohorte,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cohorteKeys.all,
      })
    },
  })
}

/* ============================================================
   MODIFIER
============================================================ */

export const useUpdateCohorte = () => {
  const queryClient = useQueryClient()

  return useMutation<
    Cohorte,
    Error,
    {
      id: string
      data: UpdateCohorteDTO
    }
  >({
    mutationFn: ({ id, data }) =>
      updateCohorte(id, data),

    onSuccess: (updatedCohorte) => {
      queryClient.invalidateQueries({
        queryKey: cohorteKeys.all,
      })

      queryClient.setQueryData(
        cohorteKeys.detail(
          String(updatedCohorte.id),
        ),
        updatedCohorte,
      )
    },
  })
}