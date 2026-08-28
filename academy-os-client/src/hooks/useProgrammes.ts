import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programmeService } from '../services/programmes/programmeService';

import type {
  CreateProgrammeDTO,
} from '../types/programme';

// ─── KEYS ────────────────────────────────────────────────────────────────────

export const programmeKeys = {
  allProgrammes: ['programmes'] as const,
  programme: (id: string) => ['programme', id] as const,
  programmeKPIs: ['programmeKPIs'] as const,
};

// ─── PROGRAMMES HOOKS ────────────────────────────────────────────────────────

export function useProgrammes() {
  return useQuery({
    queryKey: programmeKeys.allProgrammes,
    queryFn: () => programmeService.getProgrammes(),
  });
}

export function useProgramme(id: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.programme(id || ''),
    queryFn: () =>
      id ? programmeService.getProgrammeById(id) : null,
    enabled: !!id,
  });
}

export function useProgrammeKPIs() {
  return useQuery({
    queryKey: programmeKeys.programmeKPIs,
    queryFn: () => programmeService.getProgrammeKPIs(),
  });
}

// ─── CRÉER UN PROGRAMME ──────────────────────────────────────────────────────

export function useCreateProgramme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProgrammeDTO) =>
      programmeService.createProgramme(dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: programmeKeys.allProgrammes,
      });

      queryClient.invalidateQueries({
        queryKey: programmeKeys.programmeKPIs,
      });
    },
  });
}

// ─── MODIFIER UN PROGRAMME ────────────────────────────────────────────────────

export function useUpdateProgramme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: CreateProgrammeDTO;
    }) =>
      programmeService.updateProgramme(id, dto),

    onSuccess: async (data) => {
      // Met immédiatement à jour le programme dans le cache
      queryClient.setQueryData(
        programmeKeys.programme(data.id),
        data,
      );

      // Recharge réellement la liste depuis l'API
      await queryClient.invalidateQueries({
        queryKey: programmeKeys.allProgrammes,
        refetchType: 'all',
      });

      // Recharge les KPI
      await queryClient.invalidateQueries({
        queryKey: programmeKeys.programmeKPIs,
        refetchType: 'all',
      });
    },
  });
}
