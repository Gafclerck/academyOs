import API from '@/api/api'
import type {
  Rentree,
  CreateRentreeDTO,
} from '@/types/rentree'

// ============================================================
// HELPER : extraction sécurisée
// ============================================================
// Le backend Django REST Framework pagine ses listes par défaut :
// { count, next, previous, results: [...] } au lieu d'un tableau
// brut. Sans cette fonction, `rentrees.filter(...)` plante avec
// "rentrees.filter is not a function" -> écran noir.
const extractList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data as T[]
  }

  if (
    data &&
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: T[] }).data
  }

  console.warn(
    '[rentreeService] Réponse API inattendue, tableau vide utilisé:',
    data,
  )
  return []
}


export const getRentrees = async (): Promise<Rentree[]> => {
  const response = await API.get('intakes/')
  return extractList<Rentree>(response.data)
}

export const getRentreeById = async (
  id: string,
): Promise<Rentree> => {
  const response = await API.get<Rentree>(
    `intakes/${id}/`,
  )

  return response.data
}

export const createRentree = async (
  data: CreateRentreeDTO,
): Promise<Rentree> => {
  const response = await API.post<Rentree>(
    'intakes/',
    data,
  )

  return response.data
}

export const updateRentree = async (
  id: string,
  data: CreateRentreeDTO,
): Promise<Rentree> => {
  const response = await API.put<Rentree>(
    `intakes/${id}/`,
    data,
  )

  return response.data
}

export const deleteRentree = async (
  id: string,
): Promise<void> => {
  await API.delete(
    `intakes/${id}/`,
  )
}


