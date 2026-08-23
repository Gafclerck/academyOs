/**
 * Service API — Gestion des Projets, Tâches & Livrables
 *
 * Base : /api/v1/projects/
 * Auth : Bearer access_token via axiosInstance centralisée
 *
 * Aucun mock. Tous les appels tapent le vrai backend Django DRF.
 */

import API from '@/api/api';
import type { AxiosError } from 'axios';
import type {
  BackendProject,
  BackendTask,
  BackendDeliverable,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateTaskPayload,
  UpdateTaskPayload,
  ProjetFilters,
} from '@/types/projet';

// ─── Helper : extraction du message d'erreur backend ─────────────────────────

interface ApiErrorData {
  detail?: string;
  message?: string;
}

function extractMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<ApiErrorData>;
  if (axiosErr?.response?.data) {
    const data = axiosErr.response.data;
    return data.detail ?? data.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── PROJETS ──────────────────────────────────────────────────────────────────

/**
 * Liste des projets avec filtres optionnels.
 * GET /api/v1/projects/?status=&cohorte=
 */
export async function getProjets(filters?: ProjetFilters): Promise<BackendProject[]> {
  try {
    const { data } = await API.get<BackendProject[]>('/projects/', { params: filters });
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les projets.'));
  }
}

/**
 * Détail d'un projet (inclut tâches + livrables).
 * GET /api/v1/projects/{id}/
 */
export async function getProjetById(id: number): Promise<BackendProject> {
  try {
    const { data } = await API.get<BackendProject>(`/projects/${id}/`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger ce projet.'));
  }
}

/**
 * Créer un projet.
 * POST /api/v1/projects/
 */
export async function createProjet(payload: CreateProjectPayload): Promise<BackendProject> {
  try {
    const { data } = await API.post<BackendProject>('/projects/', payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de créer le projet.'));
  }
}

/**
 * Mettre à jour un projet.
 * PATCH /api/v1/projects/{id}/
 */
export async function updateProjet(id: number, payload: UpdateProjectPayload): Promise<BackendProject> {
  try {
    const { data } = await API.patch<BackendProject>(`/projects/${id}/`, payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de mettre à jour le projet.'));
  }
}

/**
 * Supprimer un projet.
 * DELETE /api/v1/projects/{id}/
 */
export async function deleteProjet(id: number): Promise<void> {
  try {
    await API.delete(`/projects/${id}/`);
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de supprimer le projet.'));
  }
}

// ─── TÂCHES ───────────────────────────────────────────────────────────────────

/**
 * Créer une tâche dans un projet.
 * POST /api/v1/projects/{projectId}/tasks/
 */
export async function createTask(projectId: number, payload: CreateTaskPayload): Promise<BackendTask> {
  try {
    const { data } = await API.post<BackendTask>(`/projects/${projectId}/tasks/`, payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de créer la tâche.'));
  }
}

/**
 * Mettre à jour une tâche (status, assignee…).
 * PATCH /api/v1/tasks/{taskId}/
 */
export async function updateTask(taskId: number, payload: UpdateTaskPayload): Promise<BackendTask> {
  try {
    const { data } = await API.patch<BackendTask>(`/tasks/${taskId}/`, payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de mettre à jour la tâche.'));
  }
}

// ─── LIVRABLES ────────────────────────────────────────────────────────────────

/**
 * Uploader un livrable pour un projet.
 * POST /api/v1/projects/{projectId}/deliverables/   (multipart/form-data)
 */
export async function uploadDeliverable(projectId: number, file: File): Promise<BackendDeliverable> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await API.post<BackendDeliverable>(
      `/projects/${projectId}/deliverables/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible d\'uploader le livrable.'));
  }
}
