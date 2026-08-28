export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * Normalise la réponse d'une liste DRF.
 *
 * Le backend peut renvoyer :
 *  1. Un tableau direct: [...]
 *  2. Une réponse paginée: { count, next, previous, results: [...] }
 *  3. Une réponse enveloppée: { data: [...] }
 */
export function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[]
  }

  if (
    data &&
    typeof data === 'object' &&
    'results' in data
  ) {
    const results = (
      data as { results?: unknown }
    ).results

    if (Array.isArray(results)) {
      return results as T[]
    }
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data
  ) {
    const result = (
      data as { data?: unknown }
    ).data

    if (Array.isArray(result)) {
      return result as T[]
    }
  }

  return []
}

/**
 * Normalise une réponse de liste (paginated ou tableau) en
 * PaginatedResponse<T>.
 */
export function normalizePaginatedResponse<T>(
  data: unknown,
): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    }
  }

  if (data && typeof data === 'object' && 'results' in data) {
    const paginated = data as {
      count?: number
      next?: string | null
      previous?: string | null
      results?: T[]
    }

    return {
      count:
        typeof paginated.count === 'number'
          ? paginated.count
          : Array.isArray(paginated.results)
            ? paginated.results.length
            : 0,
      next:
        typeof paginated.next === 'string'
          ? paginated.next
          : null,
      previous:
        typeof paginated.previous === 'string'
          ? paginated.previous
          : null,
      results: Array.isArray(paginated.results)
        ? paginated.results
        : [],
    }
  }

  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
  }
}
