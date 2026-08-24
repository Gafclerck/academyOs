import api from '@/api/api'

import type {
  Cohorte,
  CreateCohorteDTO,
  UpdateCohorteDTO,
} from '@/types/cohorte'

interface CohortesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Cohorte[]
}

const extractList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data as T[]
  }

  if (
    data &&
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray(
      (data as { results: unknown }).results,
    )
  ) {
    return (data as { results: T[] }).results
  }

  return []
}

/* ============================================================
   GET COHORTES
============================================================ */

export const getCohortes = async (): Promise<Cohorte[]> => {
  const response = await api.get<CohortesResponse>(
    '/cohorts/',
  )

  console.log(
    '🔥 GET COHORTES:',
    response.data,
  )

  return extractList<Cohorte>(
    response.data,
  )
}

/* ============================================================
   GET COHORTE
============================================================ */

export const getCohorteById = async (
  id: string,
): Promise<Cohorte> => {
  if (!id) {
    throw new Error(
      "L'identifiant de la cohorte est obligatoire.",
    )
  }

  const response = await api.get<Cohorte>(
    `/cohorts/${id}/`,
  )

  console.log(
    '🔥 GET COHORTE:',
    response.data,
  )

  return response.data
}

/* ============================================================
   CREATE COHORTE
============================================================ */

export const createCohorte = async (
  data: CreateCohorteDTO,
): Promise<Cohorte> => {
  const response = await api.post<Cohorte>(
    '/cohorts/',
    data,
  )

  console.log(
    '🔥 CREATE COHORTE:',
    response.data,
  )

  return response.data
}

/* ============================================================
   UPDATE COHORTE
============================================================ */

export const updateCohorte = async (
  id: string,
  data: UpdateCohorteDTO,
): Promise<Cohorte> => {
  if (!id) {
    throw new Error(
      "L'identifiant de la cohorte est obligatoire.",
    )
  }

  console.log(
    '📤 UPDATE COHORTE:',
    {
      url: `/cohorts/${id}/`,
      data,
    },
  )

  const response = await api.patch<Cohorte>(
    `/cohorts/${id}/`,
    data,
  )

  console.log(
    '✅ COHORTE MODIFIÉE:',
    response.data,
  )

  return response.data
}

/* ============================================================
   EXPORT
============================================================ */

const cohorteService = {
  getCohortes,
  getCohorteById,
  createCohorte,
  updateCohorte,
}

export default cohorteService