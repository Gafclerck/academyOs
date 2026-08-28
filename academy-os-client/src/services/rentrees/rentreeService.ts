import API from '@/api/api'

import type {
  Rentree,
  CreateRentreeDTO,
  UpdateRentreeDTO,
} from '@/types/rentree'

// ============================================================
// TYPES API
// ============================================================

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ============================================================
// HELPER : EXTRACTION LISTE
// ============================================================

/**
 * Django REST Framework peut retourner :
 *
 * 1. Un tableau directement :
 * [
 *   {...},
 *   {...}
 * ]
 *
 * 2. Une réponse paginée :
 * {
 *   count: 10,
 *   next: "...",
 *   previous: null,
 *   results: [...]
 * }
 *
 * 3. Une réponse enveloppée :
 * {
 *   data: [...]
 * }
 */
const extractList = <T>(data: unknown): T[] => {
  // ----------------------------------------------------------
  // Tableau direct
  // ----------------------------------------------------------

  if (Array.isArray(data)) {
    return data as T[]
  }

  // ----------------------------------------------------------
  // DRF pagination
  // ----------------------------------------------------------

  if (
    data &&
    typeof data === 'object' &&
    'results' in data
  ) {
    const results = (
      data as {
        results?: unknown
      }
    ).results

    if (Array.isArray(results)) {
      return results as T[]
    }
  }

  // ----------------------------------------------------------
  // { data: [...] }
  // ----------------------------------------------------------

  if (
    data &&
    typeof data === 'object' &&
    'data' in data
  ) {
    const result = (
      data as {
        data?: unknown
      }
    ).data

    if (Array.isArray(result)) {
      return result as T[]
    }
  }

  // ----------------------------------------------------------
  // Réponse inattendue
  // ----------------------------------------------------------

  console.warn(
    '[rentreeService] Réponse API inattendue :',
    data,
  )

  return []
}

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
    Rentree[] | PaginatedResponse<Rentree>
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