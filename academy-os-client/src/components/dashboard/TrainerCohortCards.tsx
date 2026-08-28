import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, ArrowRight, Users } from 'lucide-react'
import type { TrainerCohortSummary } from '@/services/dashboard/dashboardService'

interface TrainerCohortCardsProps {
  cohorts: TrainerCohortSummary[]
}

export const TrainerCohortCards: React.FC<TrainerCohortCardsProps> = ({
  cohorts,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Mes Cohortes Assignées
          </h2>
          <p className="text-xs text-slate-500">
            Aperçu de la progression de vos promotions actives
          </p>
        </div>
        <Link
          to="/cohortes"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B0B] hover:underline"
        >
          Voir toutes mes cohortes
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cohorts.map((cohort) => {
          const progressRounded = Math.round(cohort.average_progress || 0)

          return (
            <Card
              key={cohort.cohort_id}
              className="flex flex-col justify-between rounded-2xl border-slate-200/80 p-5 transition-all duration-200 hover:border-[#FF6B0B]/30 hover:shadow-md dark:border-white/10 dark:bg-[#1f1f38]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                    <GraduationCap className="size-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      cohort.status === 'ongoing'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }
                  >
                    {cohort.status === 'ongoing' ? 'En cours' : cohort.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {cohort.cohort_name}
                  </h3>
                  <p className="text-xs text-slate-500">{cohort.program_name}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-500">Progression</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {progressRounded}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#FF6B0B] transition-all duration-500"
                      style={{ width: `${progressRounded}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="size-4 text-slate-400" />
                  {cohort.learners_count} apprenants
                </span>

                <Link
                  to={`/cohortes/${cohort.cohort_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B0B] hover:underline"
                >
                  Ouvrir l'espace
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
