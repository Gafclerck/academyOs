import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programmeService } from '../services/programmeService';
import type {
  CreateProgrammeDTO,
  CreateSessionDTO,
  CreateCohorteDTO,
} from '../types/programme';

// ─── KEYS ────────────────────────────────────────────────────────────────────

export const programmeKeys = {
  allProgrammes: ['programmes'] as const,
  programme: (id: string) => ['programme', id] as const,
  programmeKPIs: ['programmeKPIs'] as const,
  programmeDetailKPIs: (id: string) => ['programmeDetailKPIs', id] as const,

  allSessions: ['sessions'] as const,
  sessionsByProgramme: (progId: string) => ['sessions', 'byProgramme', progId] as const,
  session: (id: string) => ['session', id] as const,
  sessionDetailKPIs: (id: string) => ['sessionDetailKPIs', id] as const,

  allCohortes: ['cohortes'] as const,
  cohortesBySession: (sessId: string) => ['cohortes', 'bySession', sessId] as const,
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

// ─── SESSIONS HOOKS ──────────────────────────────────────────────────────────

export function useSessionsByProgramme(programmeId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.sessionsByProgramme(programmeId || ''),
    queryFn: () => (programmeId ? programmeService.getSessionsByProgramme(programmeId) : []),
    enabled: !!programmeId,
  });
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.session(id || ''),
    queryFn: () => (id ? programmeService.getSessionById(id) : null),
    enabled: !!id,
  });
}

export function useSessionDetailKPIs(sessionId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.sessionDetailKPIs(sessionId || ''),
    queryFn: () => (sessionId ? programmeService.getSessionDetailKPIs(sessionId) : null),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSessionDTO) => programmeService.createSession(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: programmeKeys.allSessions });
      queryClient.invalidateQueries({ queryKey: programmeKeys.sessionsByProgramme(data.programme_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.programmeDetailKPIs(data.programme_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.allProgrammes });
    },
  });
}

// ─── COHORTES HOOKS ──────────────────────────────────────────────────────────

export function useCohortesBySession(sessionId: string | undefined) {
  return useQuery({
    queryKey: programmeKeys.cohortesBySession(sessionId || ''),
    queryFn: () => (sessionId ? programmeService.getCohortesBySession(sessionId) : []),
    enabled: !!sessionId,
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
      queryClient.invalidateQueries({ queryKey: programmeKeys.cohortesBySession(data.session_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.sessionDetailKPIs(data.session_id) });
      queryClient.invalidateQueries({ queryKey: programmeKeys.allSessions });
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
    queryFn: () => (cohorteId ? programmeService.getMembresByCohorte(cohorteId) : []),
    enabled: !!cohorteId,
  });
}
