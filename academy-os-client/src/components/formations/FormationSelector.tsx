import type { Cohorte } from '@/types/cohorte'
import { Layers } from 'lucide-react'

const ENROLLMENT_LABELS: Record<string, string> = {
  completed: 'Terminée',
  dropped: 'Abandonnée',
  suspended: 'Suspendue',
}

const ENROLLMENT_BADGE_CLASSES: Record<string, string> = {
  completed: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  dropped: 'bg-red-500/10 text-red-600',
  suspended: 'bg-amber-500/10 text-amber-600',
}

interface FormationSelectorProps {
  cohorts: Cohorte[]
  selectedCohortId: string | null
  onSelect: (cohortId: string) => void
}

const FormationSelector: React.FC<FormationSelectorProps> = ({
  cohorts,
  selectedCohortId,
  onSelect,
}) => {
  if (cohorts.length <= 1) return null

  const sorted = [...cohorts].sort((a, b) => {
    const rankA = a.enrollment_status === 'active' ? 0 : 1
    const rankB = b.enrollment_status === 'active' ? 0 : 1
    if (rankA !== rankB) return rankA - rankB
    const ta = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0
    const tb = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0
    return tb - ta
  })

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((cohort) => {
        const active = cohort.id === selectedCohortId
        const statusLabel =
          ENROLLMENT_LABELS[cohort.enrollment_status ?? ''] ?? ''
        const statusClass =
          ENROLLMENT_BADGE_CLASSES[cohort.enrollment_status ?? ''] ?? ''
        return (
          <button
            key={cohort.id}
            type="button"
            onClick={() => onSelect(cohort.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-left transition-colors ${
              active
                ? 'border-[#FF6B0B]/40 bg-[#FF6B0B]/10'
                : 'border-slate-200 bg-white hover:border-[#FF6B0B]/40 dark:border-white/10 dark:bg-[#1f1f38]'
            }`}
          >
            <Layers
              className={`size-4 shrink-0 ${
                active ? 'text-[#FF6B0B]' : 'text-slate-400'
              }`}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span
                  className={`truncate text-sm font-semibold ${
                    active
                      ? 'text-[#FF6B0B]'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {cohort.name}
                </span>
                {statusLabel && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                )}
              </span>
              {cohort.program_name && (
                <span className="block truncate text-[11px] text-slate-400">
                  {cohort.program_name}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default FormationSelector