import { useEffect, useMemo, useState } from 'react'
import { useMyCohorts } from '@/hooks/useMyCohorts'
import type { Cohorte } from '@/types/cohorte'

/**
 * Règle de sélection par défaut, identique au backend
 * `get_learner_dashboard_stats` : inscription ACTIVE la plus récente
 * (`enrolled_at`), sinon la plus récente toutes statuts confondus.
 */
export function mostRecentCohortId(cohorts: Cohorte[]): string | null {
  if (cohorts.length === 0) return null
  const active = cohorts.filter((c) => c.enrollment_status === 'active')
  const pool = active.length > 0 ? active : cohorts
  const [first] = [...pool].sort((a, b) => {
    const ta = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0
    const tb = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0
    return tb - ta
  })
  return first?.id ?? pool[0]?.id ?? null
}

export function useFormations() {
  const { data: cohorts = [], isLoading, refetch } = useMyCohorts()
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null)

  const defaultCohortId = useMemo(
    () => mostRecentCohortId(cohorts),
    [cohorts],
  )

  useEffect(() => {
    if (!defaultCohortId) return
    setSelectedCohortId((prev) =>
      prev && cohorts.some((c) => c.id === prev)
        ? prev
        : defaultCohortId,
    )
  }, [cohorts, defaultCohortId])

  return {
    cohorts,
    selectedCohortId,
    setSelectedCohortId,
    defaultCohortId,
    isLoading,
    refetch,
  }
}