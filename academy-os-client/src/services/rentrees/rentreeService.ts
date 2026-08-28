import API from '@/api/api'

import { extractList } from '@/lib/pagination'

import type {
  Rentree,
  CreateRentreeDTO,
  UpdateRentreeDTO,
} from '@/types/rentree'

// ============================================================
// GET RENTREES
// ============================================================

/**
 * Récupère les rentrées accessibles à l'utilisateur connecté.
 *
 * IMPORTANT :
 * Le filtrage par utilisateur/rôle doit idéalement être effectué
 * par le backend.
 *
 * Exemple :
 *
 * ADMIN
 *   -> toutes les rentrées
 *
 * ORGANIZER
 *   -> rentrées qu'il gère
 *
 * TRAINER
 *   -> rentrées liées à ses cohortes/programmes
 *
 * LEARNER
 *   -> rentrées liées à ses inscriptions
 */
export const getRentrees = async (): Promise<Rentree[]> => {
  const response = await API.get<
    Rentree[] | { count: number; next: string | null; previous: string | null; results: Rentree[] }
  >('intakes/')

  return extractList<Rentree>(response.data)
}

// ============================================================
// GET RENTREE BY ID
// ============================================================

export const getRentreeById = async (
  id: string,
): Promise<Rentree> => {
  const response = await API.get<Rentree>(
    `intakes/${id}/`,
  )

  return response.data
}

// ============================================================
// CREATE RENTREE
// ============================================================

export const createRentree = async (
  data: CreateRentreeDTO,
): Promise<Rentree> => {
  const response = await API.post<Rentree>(
    'intakes/',
    data,
  )

  return response.data
}

// ============================================================
// UPDATE RENTREE
// ============================================================

export const updateRentree = async (
  id: string,
  data: UpdateRentreeDTO,
): Promise<Rentree> => {
  const response = await API.put<Rentree>(
    `intakes/${id}/`,
    data,
  )

  return response.data
}

// ============================================================
// DELETE RENTREE
// ============================================================

export const deleteRentree = async (
  id: string,
): Promise<void> => {
  await API.delete(
    `intakes/${id}/`,
  )
}