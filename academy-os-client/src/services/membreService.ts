/**
 * Service API - Gestion des Membres de Cohorte
 *
 * Endpoints backend :
 *
 * GET    /api/v1/cohorts/{cohortId}/enrollments/
 * POST   /api/v1/cohorts/{cohortId}/enrollments/
 *
 * GET    /api/v1/cohorts/{cohortId}/trainer-assignments/
 * POST   /api/v1/cohorts/{cohortId}/trainer-assignments/
 *
 * PATCH  /api/v1/cohorts/{cohortId}/enrollments/{enrollmentId}/
 */

import axios from 'axios'

import type {
  BackendEnrollment,
  BackendTrainerAssignment,
  MemberBatchResult,
  AssignMentorPayload,
  AddMembersPayload,
} from '@/types/programme'
import { tokenStore } from '@/lib/tokenStore'



// ============================================================
// CONFIGURATION API
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

// ============================================================
// AUTHENTIFICATION
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccessToken()

    console.log(
      '🔐 TOKEN DISPONIBLE:',
      token ? 'OUI' : 'NON',
    )

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ============================================================
// GESTION DES ERREURS
// ============================================================

function extractMessage(
  err: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | {
          message?: string
          detail?: string
          error?: string
          results?: unknown
        }
      | undefined

    console.error(
      '❌ API ERROR:',
      {
        status: err.response?.status,
        data: err.response?.data,
      },
    )

    return (
      data?.message ??
      data?.detail ??
      data?.error ??
      err.message ??
      fallback
    )
  }

  if (err instanceof Error) {
    return err.message
  }

  return fallback
}

// ============================================================
// MOCK
// ============================================================

const USE_MOCK = false

const delay = (ms = 400) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, ms),
  )

// ============================================================
// MOCK ENROLLMENTS
// ============================================================

const MOCK_ENROLLMENTS: BackendEnrollment[] = [
  {
    id: 'enr-1',

    user: {
      id: 'u-1',
      email: 'moussa.diop@xarala.co',
      first_name: 'Moussa',
      last_name: 'Diop',
      full_name: 'Moussa Diop',
      role: 'learner',
      status: 'active',
      phone_number: '',
      created_at: '2026-01-10',
    },

    cohort: 'coh-1',
    status: 'active',
    enrolled_at: '2026-01-15T10:00:00Z',
    mentor: null,
  },

  {
    id: 'enr-2',

    user: {
      id: 'u-2',
      email: 'awa.sow@xarala.co',
      first_name: 'Awa',
      last_name: 'Sow',
      full_name: 'Awa Sow',
      role: 'learner',
      status: 'active',
      phone_number: '',
      created_at: '2026-01-10',
    },

    cohort: 'coh-1',
    status: 'active',
    enrolled_at: '2026-01-15T10:05:00Z',

    mentor: {
      id: 'trn-1',

      user: {
        id: 'u-4',
        email: 'fatou.ndiaye@xarala.co',
        first_name: 'Fatou',
        last_name: 'Ndiaye',
        full_name: 'Fatou Ndiaye',
        role: 'trainer',
        status: 'active',
        phone_number: '',
        created_at: '2026-01-05',
      },

      status: 'active',
      assigned_at: '2026-01-16T08:00:00Z',
    },
  },
]

// ============================================================
// MOCK TRAINERS
// ============================================================

const MOCK_TRAINERS: BackendTrainerAssignment[] = [
  {
    id: 'trn-1',

    user: {
      id: 'u-4',
      email: 'fatou.ndiaye@xarala.co',
      first_name: 'Fatou',
      last_name: 'Ndiaye',
      full_name: 'Fatou Ndiaye',
      role: 'trainer',
      status: 'active',
      phone_number: '',
      created_at: '2026-01-05',
    },

    cohort: 'coh-1',
    status: 'active',
    assigned_at: '2026-01-16T08:00:00Z',
  },
]

// ============================================================
// GET ENROLLMENTS
// ============================================================

export async function getEnrollments(
  cohortId: string,
): Promise<BackendEnrollment[]> {
  try {
    if (!cohortId) {
      throw new Error(
        'Identifiant de cohorte manquant.',
      )
    }

    if (USE_MOCK) {
      await delay(500)

      return MOCK_ENROLLMENTS.filter(
        (enrollment) =>
          enrollment.cohort === cohortId,
      )
    }

    const { data } =
      await api.get(
        `/cohorts/${cohortId}/enrollments/`,
      )

    console.log(
      '🔥 GET ENROLLMENTS RESPONSE:',
      data,
    )

    if (
      data &&
      Array.isArray(data.results)
    ) {
      return data.results
    }

    if (Array.isArray(data)) {
      return data
    }

    return []
  } catch (err) {
    console.error(
      '❌ GET ENROLLMENTS ERROR:',
      err,
    )

    throw new Error(
      extractMessage(
        err,
        'Impossible de charger les inscriptions.',
      ),
    )
  }
}

// ============================================================
// GET TRAINER ASSIGNMENTS
// ============================================================

export async function getTrainerAssignments(
  cohortId: string,
): Promise<BackendTrainerAssignment[]> {
  try {
    if (!cohortId) {
      throw new Error(
        'Identifiant de cohorte manquant.',
      )
    }

    if (USE_MOCK) {
      await delay(500)

      return MOCK_TRAINERS.filter(
        (trainer) =>
          trainer.cohort === cohortId,
      )
    }

    const { data } =
      await api.get(
        `/cohorts/${cohortId}/trainer-assignments/`,
      )

    console.log(
      '🔥 GET TRAINER ASSIGNMENTS RESPONSE:',
      data,
    )

    if (
      data &&
      Array.isArray(data.results)
    ) {
      return data.results
    }

    if (Array.isArray(data)) {
      return data
    }

    return []
  } catch (err) {
    console.error(
      '❌ GET TRAINER ASSIGNMENTS ERROR:',
      err,
    )

    throw new Error(
      extractMessage(
        err,
        'Impossible de charger les affectations formateurs.',
      ),
    )
  }
}

// ============================================================
// POST ENROLLMENTS
// ============================================================

export async function addLearners(
  cohortId: string,
  emails: string[],
): Promise<MemberBatchResult> {
  try {
    if (!cohortId) {
      throw new Error(
        'Identifiant de cohorte manquant.',
      )
    }

    if (emails.length === 0) {
      throw new Error(
        'Aucun apprenant sélectionné.',
      )
    }

    const payload: AddMembersPayload = {
      emails,
    }

    console.log(
      '📤 POST ENROLLMENTS',
      {
        url: `/cohorts/${cohortId}/enrollments/`,
        payload,
      },
    )

    const { data } =
      await api.post<MemberBatchResult>(
        `/cohorts/${cohortId}/enrollments/`,
        payload,
      )

    console.log(
      '✅ POST ENROLLMENTS RESPONSE:',
      data,
    )

    return data
  } catch (err) {
    console.error(
      '❌ POST ENROLLMENTS ERROR:',
      err,
    )

    throw new Error(
      extractMessage(
        err,
        "Impossible d'ajouter les apprenants.",
      ),
    )
  }
}

// ============================================================
// POST TRAINER ASSIGNMENTS
// ============================================================

export async function addTrainers(
  cohortId: string,
  emails: string[],
): Promise<MemberBatchResult> {
  try {
    if (!cohortId) {
      throw new Error(
        'Identifiant de cohorte manquant.',
      )
    }

    if (emails.length === 0) {
      throw new Error(
        'Aucun formateur sélectionné.',
      )
    }

    const payload: AddMembersPayload = {
      emails,
    }

    console.log(
      '📤 POST TRAINER ASSIGNMENTS',
      {
        url: `/cohorts/${cohortId}/trainer-assignments/`,
        payload,
      },
    )

    const { data } =
      await api.post<MemberBatchResult>(
        `/cohorts/${cohortId}/trainer-assignments/`,
        payload,
      )

    console.log(
      '✅ POST TRAINER ASSIGNMENTS RESPONSE:',
      data,
    )

    return data
  } catch (err) {
    console.error(
      '❌ POST TRAINER ASSIGNMENTS ERROR:',
      err,
    )

    throw new Error(
      extractMessage(
        err,
        "Impossible d'ajouter les formateurs.",
      ),
    )
  }
}

// ============================================================
// PATCH MENTOR
// ============================================================

export async function assignMentor(
  cohortId: string,
  enrollmentId: string,
  mentorId: string | null,
): Promise<BackendEnrollment> {
  try {
    if (!cohortId) {
      throw new Error(
        'Identifiant de cohorte manquant.',
      )
    }

    if (!enrollmentId) {
      throw new Error(
        "Identifiant d'inscription manquant.",
      )
    }

    if (USE_MOCK) {
      await delay(400)

      const enrollment =
        MOCK_ENROLLMENTS.find(
          (item) =>
            item.id === enrollmentId,
        )

      if (!enrollment) {
        throw new Error(
          'Inscription introuvable.',
        )
      }

      if (mentorId) {
        const trainer =
          MOCK_TRAINERS.find(
            (item) =>
              item.id === mentorId,
          )

        enrollment.mentor = trainer
          ? {
              id: trainer.id,
              user: trainer.user,
              status: trainer.status,
              assigned_at:
                trainer.assigned_at,
            }
          : null
      } else {
        enrollment.mentor = null
      }

      return {
        ...enrollment,
      }
    }

    const payload: AssignMentorPayload = {
      mentor: mentorId,
    }

    const { data } =
      await api.patch<BackendEnrollment>(
        `/cohorts/${cohortId}/enrollments/${enrollmentId}/`,
        payload,
      )

    return data
  } catch (err) {
    console.error(
      '❌ PATCH MENTOR ERROR:',
      err,
    )

    throw new Error(
      extractMessage(
        err,
        "Impossible d'assigner le mentor.",
      ),
    )
  }
}