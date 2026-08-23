/**
 * Hooks React Query — Module Projets, Tâches & Livrables
 *
 * Convention : useProjets(filters), useProjet(id)
 * Pattern : TanStack React Query v5 (cohérent avec useProgrammes.ts)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getProjets,
  getProjetById,
  createProjet,
  updateProjet,
  deleteProjet,
  createTask,
  updateTask,
  uploadDeliverable,
} from '@/services/projets/projetService';
import type {
  BackendProject,
  ProjetFilters,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@/types/projet';

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────

export const projetKeys = {
  all: ['projets'] as const,
  list: (filters?: ProjetFilters) => ['projets', 'list', filters] as const,
  detail: (id: number) => ['projets', 'detail', id] as const,
};

// ─── QUERIES ──────────────────────────────────────────────────────────────────

/**
 * Liste des projets avec filtres optionnels.
 * Retourne { data: BackendProject[], isLoading, error, refetch }
 */
export function useProjets(filters?: ProjetFilters) {
  return useQuery({
    queryKey: projetKeys.list(filters),
    queryFn: () => getProjets(filters),
  });
}

/**
 * Détail d'un projet (inclut tâches + livrables).
 * Retourne { data: BackendProject, isLoading, error, refetch }
 */
export function useProjet(id: number | undefined) {
  return useQuery({
    queryKey: projetKeys.detail(id ?? 0),
    queryFn: () => getProjetById(id!),
    enabled: !!id,
  });
}

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

/**
 * Créer un projet.
 * Invalide la liste projets après succès.
 */
export function useCreateProjet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProjet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projetKeys.all });
      toast.success('Projet créé avec succès');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/**
 * Mettre à jour un projet.
 * Invalide la liste et le détail du projet après succès.
 */
export function useUpdateProjet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProjectPayload }) =>
      updateProjet(id, payload),
    onSuccess: (data: BackendProject) => {
      queryClient.invalidateQueries({ queryKey: projetKeys.all });
      queryClient.invalidateQueries({ queryKey: projetKeys.detail(data.id) });
      toast.success('Projet mis à jour');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/**
 * Supprimer un projet.
 * Invalide la liste projets après succès.
 */
export function useDeleteProjet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProjet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projetKeys.all });
      toast.success('Projet supprimé');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/**
 * Créer une tâche dans un projet.
 * Invalide le détail du projet parent après succès.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, payload }: { projectId: number; payload: CreateTaskPayload }) =>
      createTask(projectId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projetKeys.detail(variables.projectId) });
      toast.success('Tâche créée');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/**
 * Mettre à jour une tâche (status, assignee…).
 * Invalide le détail du projet parent après succès.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: UpdateTaskPayload;
      projectId: number;
    }) => updateTask(taskId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projetKeys.detail(variables.projectId) });
      toast.success('Tâche mise à jour');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/**
 * Uploader un livrable pour un projet.
 * Invalide le détail du projet parent après succès.
 */
export function useUploadDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, file }: { projectId: number; file: File }) =>
      uploadDeliverable(projectId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projetKeys.detail(variables.projectId) });
      toast.success('Livrable uploadé avec succès');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
