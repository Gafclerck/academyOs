import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import projetService from '@/services/projets/projetService'

import type {
  CreateProjetDTO,
  PatchProjetDTO,
  ProjetStatus,
} from '@/types/projet'

/* ============================================================
   TYPES
============================================================ */

interface UseProjetsParams {
  page?: number
  page_size?: number
  program?: string
  status?: ProjetStatus
  search?: string
}

/* ============================================================
   LISTE DES PROJETS
============================================================ */

export const useProjets = (
  params?: UseProjetsParams,
) => {
  return useQuery({
    queryKey: [
      'projets',
      params,
    ],

    queryFn: () =>
      projetService.getProjets(params),
  })
}

/* ============================================================
   DÉTAIL D'UN PROJET
============================================================ */

export const useProjet = (
  id?: string,
) => {
  return useQuery({
    queryKey: [
      'projet',
      id,
    ],

    queryFn: () =>
      projetService.getProjetById(id!),

    enabled: Boolean(id),
  })
}

/* ============================================================
   CRÉER UN PROJET
============================================================ */

export const useCreateProjet = () => {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      data: CreateProjetDTO,
    ) =>
      projetService.createProjet(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projets'],
      })
    },
  })
}

/* ============================================================
   MODIFIER UN PROJET
============================================================ */

export const useUpdateProjet = () => {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: CreateProjetDTO
    }) =>
      projetService.updateProjet(
        id,
        data,
      ),

    onSuccess: (
      projet,
    ) => {
      queryClient.invalidateQueries({
        queryKey: ['projets'],
      })

      queryClient.invalidateQueries({
        queryKey: [
          'projet',
          projet.id,
        ],
      })
    },
  })
}

/* ============================================================
   MODIFICATION PARTIELLE
============================================================ */

export const usePatchProjet = () => {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: PatchProjetDTO
    }) =>
      projetService.patchProjet(
        id,
        data,
      ),

    onSuccess: (
      projet,
    ) => {
      queryClient.invalidateQueries({
        queryKey: ['projets'],
      })

      queryClient.invalidateQueries({
        queryKey: [
          'projet',
          projet.id,
        ],
      })
    },
  })
}

/* ============================================================
   SUPPRIMER
============================================================ */

export const useDeleteProjet = () => {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      id: string,
    ) =>
      projetService.deleteProjet(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projets'],
      })
    },
  })
}