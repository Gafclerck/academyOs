/**
 * Service API - Gestion des Membres de Cohorte
 *
 * Endpoints backend (DRF) :
 *   GET    /api/v1/cohorts/{cohortId}/enrollments/        → liste des apprenants inscrits
 *   POST   /api/v1/cohorts/{cohortId}/enrollments/        → ajout batch par emails
 *   GET    /api/v1/cohorts/{cohortId}/trainer-assignments/ → liste des formateurs affectés
 *   POST   /api/v1/cohorts/{cohortId}/trainer-assignments/ → ajout batch par emails
 *   PATCH  /api/v1/cohorts/{cohortId}/enrollments/{enrollmentId}/ → assigner/retirer mentor
 */

import axios from 'axios';
import type {
  BackendEnrollment,
  BackendTrainerAssignment,
  MemberBatchResult,
  AssignMentorPayload,
  AddMembersPayload,
} from '@/modules/programme/types/programme';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const serverMsg = (err.response?.data as { message?: string })?.message;
    return serverMsg ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

const USE_MOCK = true;

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_ENROLLMENTS: BackendEnrollment[] = [
  {
    id: 'enr-1',
    user: { id: 'u-1', email: 'moussa.diop@xarala.co', first_name: 'Moussa', last_name: 'Diop', full_name: 'Moussa Diop', role: 'learner', status: 'active', phone_number: '', created_at: '2026-01-10' },
    cohort: 'coh-1',
    status: 'active',
    enrolled_at: '2026-01-15T10:00:00Z',
    mentor: null,
  },
  {
    id: 'enr-2',
    user: { id: 'u-2', email: 'awa.sow@xarala.co', first_name: 'Awa', last_name: 'Sow', full_name: 'Awa Sow', role: 'learner', status: 'active', phone_number: '', created_at: '2026-01-10' },
    cohort: 'coh-1',
    status: 'active',
    enrolled_at: '2026-01-15T10:05:00Z',
    mentor: {
      id: 'trn-1',
      user: { id: 'u-4', email: 'fatou.ndiaye@xarala.co', first_name: 'Fatou', last_name: 'Ndiaye', full_name: 'Fatou Ndiaye', role: 'trainer', status: 'active', phone_number: '', created_at: '2026-01-05' },
      status: 'active',
      assigned_at: '2026-01-16T08:00:00Z',
    },
  },
];

const MOCK_TRAINERS: BackendTrainerAssignment[] = [
  {
    id: 'trn-1',
    user: { id: 'u-4', email: 'fatou.ndiaye@xarala.co', first_name: 'Fatou', last_name: 'Ndiaye', full_name: 'Fatou Ndiaye', role: 'trainer', status: 'active', phone_number: '', created_at: '2026-01-05' },
    cohort: 'coh-1',
    status: 'active',
    assigned_at: '2026-01-16T08:00:00Z',
  },
];

export async function getEnrollments(cohortId: string): Promise<BackendEnrollment[]> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return MOCK_ENROLLMENTS.filter((e) => e.cohort === cohortId);
    }
    const { data } = await api.get<BackendEnrollment[]>(`cohorts/${cohortId}/enrollments/`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les inscriptions.'));
  }
}

export async function getTrainerAssignments(cohortId: string): Promise<BackendTrainerAssignment[]> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return MOCK_TRAINERS.filter((t) => t.cohort === cohortId);
    }
    const { data } = await api.get<BackendTrainerAssignment[]>(`cohorts/${cohortId}/trainer-assignments/`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les affectations formateurs.'));
  }
}

export async function addLearners(cohortId: string, emails: string[]): Promise<MemberBatchResult> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return {
        results: emails.map((email) => ({
          email,
          status: 'enrolled',
          detail: 'Membre ajouté.',
        })),
      };
    }
    const payload: AddMembersPayload = { emails };
    const { data } = await api.post<MemberBatchResult>(`cohorts/${cohortId}/enrollments/`, payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible d\'ajouter les apprenants.'));
  }
}

export async function addTrainers(cohortId: string, emails: string[]): Promise<MemberBatchResult> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return {
        results: emails.map((email) => ({
          email,
          status: 'assigned',
          detail: 'Formateur ajouté.',
        })),
      };
    }
    const payload: AddMembersPayload = { emails };
    const { data } = await api.post<MemberBatchResult>(`cohorts/${cohortId}/trainer-assignments/`, payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible d\'ajouter les formateurs.'));
  }
}

export async function assignMentor(
  cohortId: string,
  enrollmentId: string,
  mentorId: string | null
): Promise<BackendEnrollment> {
  try {
    if (USE_MOCK) {
      await delay(400);
      const enrollment = MOCK_ENROLLMENTS.find((e) => e.id === enrollmentId);
      if (!enrollment) throw new Error('Inscription introuvable.');
      if (mentorId) {
        const trainer = MOCK_TRAINERS.find((t) => t.id === mentorId);
        enrollment.mentor = trainer
          ? {
              id: trainer.id,
              user: trainer.user,
              status: trainer.status,
              assigned_at: trainer.assigned_at,
            }
          : null;
      } else {
        enrollment.mentor = null;
      }
      return { ...enrollment };
    }
    const payload: AssignMentorPayload = { mentor: mentorId };
    const { data } = await api.patch<BackendEnrollment>(
      `cohorts/${cohortId}/enrollments/${enrollmentId}/`,
      payload
    );
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible d\'assigner le mentor.'));
  }
}
