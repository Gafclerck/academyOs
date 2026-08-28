import api from '@/api/api'

import { parseApiError } from '@/lib/errorUtils'

import type {
  BackendEnrollment,
  BackendTrainerAssignment,
  MemberBatchResult,
  AssignMentorPayload,
  AddMembersPayload,
} from '@/types/programme'

// ============================================================
// GET ENROLLMENTS
// ============================================================

export async function getEnrollments(
  cohortId: string,
): Promise<BackendEnrollment[]> {
  if (!cohortId) {
    throw new Error(
      'Identifiant de cohorte manquant.',
    )
  }

  try {
    const { data } =
      await api.get(
        `/cohorts/${cohortId}/enrollments/`,
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
    throw new Error(
      parseApiError(err).message,
    )
  }
}

// ============================================================
// GET TRAINER ASSIGNMENTS
// ============================================================

export async function getTrainerAssignments(
  cohortId: string,
): Promise<BackendTrainerAssignment[]> {
  if (!cohortId) {
    throw new Error(
      'Identifiant de cohorte manquant.',
    )
  }

  try {
    const { data } =
      await api.get(
        `/cohorts/${cohortId}/trainer-assignments/`,
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
    throw new Error(
      parseApiError(err).message,
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

  try {
    const { data } =
      await api.post<MemberBatchResult>(
        `/cohorts/${cohortId}/enrollments/`,
        payload,
      )

    return data
  } catch (err) {
    throw new Error(
      parseApiError(err).message,
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

  try {
    const { data } =
      await api.post<MemberBatchResult>(
        `/cohorts/${cohortId}/trainer-assignments/`,
        payload,
      )

    return data
  } catch (err) {
    throw new Error(
      parseApiError(err).message,
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

  const payload: AssignMentorPayload = {
    mentor: mentorId,
  }

  try {
    const { data } =
      await api.patch<BackendEnrollment>(
        `/cohorts/${cohortId}/enrollments/${enrollmentId}/`,
        payload,
      )

    return data
  } catch (err) {
    throw new Error(
      parseApiError(err).message,
    )
  }
}
