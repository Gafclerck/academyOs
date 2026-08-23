/**
 * Types TypeScript — Module Projets (API Backend Django DRF)
 *
 * Contrat API : /api/v1/projects/
 * Ce fichier est la source de vérité pour tous les types backend du module Projets.
 */

// ─── Backend Models ──────────────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'active' | 'done';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface BackendProject {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  cohorte: string;
  deadline: string;
  tasks: BackendTask[];
  deliverables: BackendDeliverable[];
}

export interface BackendTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string | null;
}

export interface BackendDeliverable {
  id: string;
  file: string;
  uploaded_by: string;
  created_at: string;
}

// ─── Payloads de création / mise à jour ──────────────────────────────────────

export interface CreateProjectPayload {
  name: string;
  description: string;
  cohorte: string;
  deadline: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  cohorte?: string;
  deadline?: string;
}

export interface CreateTaskPayload {
  title: string;
  status?: TaskStatus;
  assignee?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  status?: TaskStatus;
  assignee?: string | null;
}

// ─── Filtres de liste ────────────────────────────────────────────────────────

export interface ProjetFilters {
  status?: ProjectStatus;
  cohorte?: string;
}
