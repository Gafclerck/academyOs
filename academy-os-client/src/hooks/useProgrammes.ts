import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programmeService } from '../services/programmes/programmeService';
import { getCohorteMembers } from '../services/membreService';
import type {
  CreateProgrammeDTO,
  CreateRentreeDTO,
  CreateCohorteDTO,
  BackendEnrollment,
  BackendTrainerAssignment,
} from '../types/programme';

// ─── KEYS ────────────────────────────────────────────────────────────────────

export const programmeKeys = {
  allProgrammes: ['programmes'] as const,
  programme: (id: string) => ['programme', id] as const,
  programmeKPIs: ['programmeKPIs'] as const,
  programmeDetailKPIs: (id: string) => ['programmeDetailKPIs', id] as const,

  allRentrees: ['rentrees'] as const,
  rentreesByProgramme: (progId: string) => ['rentrees', 'byProgramme', progId] as const,
  rentree: (id: string) => ['rentree', id] as const,
  rentreeDetailKPIs: (id: string) => ['rentreeDetailKPIs', id] as const,

  allCohortes: ['cohortes'] as const,
  cohortesByRentree: (rentreeId: string) => ['cohortes', 'byRentree', rentreeId] as const,
  cohorte: (id: string) => ['cohorte', id] as const,
  cohorteDetailKPIs: (id: string) => ['cohorteDetailKPIs', id] as const,

  projetsByCohorte: (cohorteId: string) => ['projets', cohorteId] as const,
  membresByCohorte: (cohorteId: string) => ['membres', cohorteId] as const,
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
    queryFn: () => (id ? programmeService.getProgrammeById(id) : null),
    enabled: !!id,
  });
}

export function useProgrammeKPIs() {
  return useQuery({
    queryKey: programmeKeys.programmeKPIs,
    queryFn: () => programmeService.getProgrammeKPIs(),
  });
}

export function useProgrammeDetailKPIs(programmeId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.programmeDetailKPIs(programmeId || ''),
    queryFn: () => (programmeId ? programmeService.getProgrammeDetailKPIs(programmeId) : null),
    enabled: !!programmeId,
  });
}

export function useCreateProgramme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProgrammeDTO) => programmeService.createProgramme(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programmeKeys.allProgrammes });
      queryClient.invalidateQueries({ queryKey: programmeKeys.programmeKPIs });
    },
  });
}

// ─── RENTRÉES HOOKS ──────────────────────────────────────────────────────────

export function useRentreesByProgramme(programmeId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.rentreesByProgramme(programmeId || ''),
    queryFn: () => (programmeId ? programmeService.getRentreesByProgramme(programmeId) : []),
    enabled: !!programmeId,
  });
}

export function useRentree(id: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.rentree(id || ''),
    queryFn: () => (id ? programmeService.getRentreeById(id) : null),
    enabled: !!id,
  });
}

export function useRentreeDetailKPIs(rentreeId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.rentreeDetailKPIs(rentreeId || ''),
    queryFn: () => (rentreeId ? programmeService.getRentreeDetailKPIs(rentreeId) : null),
    enabled: !!rentreeId,
  });
}

export function useCreateRentree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRentreeDTO) => programmeService.createRentree(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: programmeKeys.allRentrees });
      queryClient.invalidateQueries({ queryKey: programmeKeys.rentreesByProgramme(data.programme_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.programmeDetailKPIs(data.programme_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.allProgrammes });
    },
  });
}

// ─── COHORTES HOOKS ──────────────────────────────────────────────────────────

export function useCohortesByRentree(rentreeId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.cohortesByRentree(rentreeId || ''),
    queryFn: () => (rentreeId ? programmeService.getCohortesByRentree(rentreeId) : []),
    enabled: !!rentreeId,
  });
}

export function useCohorte(id: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.cohorte(id || ''),
    queryFn: () => (id ? programmeService.getCohorteById(id) : null),
    enabled: !!id,
  });
}

export function useCohorteDetailKPIs(cohorteId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.cohorteDetailKPIs(cohorteId || ''),
    queryFn: () => (cohorteId ? programmeService.getCohorteDetailKPIs(cohorteId) : null),
    enabled: !!cohorteId,
  });
}

export function useCreateCohorte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCohorteDTO) => programmeService.createCohorte(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: programmeKeys.allCohortes });
      queryClient.invalidateQueries({ queryKey: programmeKeys.cohortesByRentree(data.rentree_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.rentreeDetailKPIs(data.rentree_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.allRentrees });
    },
  });
}

// ─── PROJETS & MEMBRES HOOKS ──────────────────────────────────────────────────

export function useProjetsByCohorte(cohorteId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.projetsByCohorte(cohorteId || ''),
    queryFn: () => (cohorteId ? programmeService.getProjetsByCohorte(cohorteId) : []),
    enabled: !!cohorteId,
  });
}

export function useMembresByCohorte(cohorteId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.membresByCohorte(cohorteId || ''),
    queryFn: async () => {
      if (!cohorteId) return [];
      const { students, trainers } = await getCohorteMembers(cohorteId);
      return [...students, ...trainers];
    },
    enabled: !!cohorteId,
  });
}

export function useCohorteMembers(cohorteId: string | undefined) {
  const [students, setStudents] = useState<BackendEnrollment[]>([]);
  const [trainers, setTrainers] = useState<BackendTrainerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!cohorteId) return;
      const data = await getCohorteMembers(cohorteId);
      setStudents(data.students);
      setTrainers(data.trainers);
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(message || "Erreur chargement membres");
    } finally {
      setLoading(false);
    }
  }, [cohorteId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { students, trainers, loading, error, refetch };
}

// ─── ALIASES DE COMPATIBILITÉ (legacy) ───────────────────────────────────────
/** @deprecated Utiliser useRentreesByProgramme */
export const useSessionsByProgramme = useRentreesByProgramme;
/** @deprecated Utiliser useRentree */
export const useSession = useRentree;
/** @deprecated Utiliser useRentreeDetailKPIs */
export const useSessionDetailKPIs = useRentreeDetailKPIs;
/** @deprecated Utiliser useCreateRentree */
export const useCreateSession = useCreateRentree;
/** @deprecated Utiliser useCohortesByRentree */
export const useCohortesBySession = useCohortesByRentree;
