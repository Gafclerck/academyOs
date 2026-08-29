import api from '@/api/api'

import { extractList } from '@/lib/pagination'

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

/* ============================================================
   GET COHORTES
============================================================ */

export const getCohortes = async (): Promise<Cohorte[]> => {
  const response = await api.get<CohortesResponse>(
    '/cohorts/',
  )

  return extractList<Cohorte>(
    response.data,
  )
}

export const getMyCohorts = async (): Promise<Cohorte[]> => {
  const response = await api.get<CohortesResponse>(
    '/cohorts/',
    { params: { enrolled: 'all' } },
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

  const response = await api.patch<Cohorte>(
    `/cohorts/${id}/`,
    data,
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
