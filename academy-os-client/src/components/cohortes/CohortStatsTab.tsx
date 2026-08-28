import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertTriangle,
} from 'lucide-react'
import { useCohortStats } from '@/hooks/useCohortStats'

interface CohortStatsTabProps {
  cohortId: string
}

export const CohortStatsTab: React.FC<CohortStatsTabProps> = ({ cohortId }) => {
  const { data: stats, isLoading, error } = useCohortStats(cohortId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Impossible de charger les statistiques de la cohorte.
      </div>
    )
  }

  const avgProgress = Math.round(stats.average_progress || 0)
  const validationRate = Math.round(stats.validation_rate || 0)

  return (
    <div className="space-y-6">
      {/* 1. INDICATEURS CLÉS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden bg-white p-4 dark:bg-[#1f1f38]">
          <div className="absolute -right-6 -bottom-6 size-20 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400">
            Progression Moyenne
          </p>
          <p className="relative mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {avgProgress}%
          </p>
          <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
            <div
              className="h-full rounded-full bg-[#FF6B0B]"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-white p-4 dark:bg-[#1f1f38]">
          <div className="absolute -right-6 -bottom-6 size-20 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400">
            Taux de Validation
          </p>
          <p className="relative mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {validationRate}%
          </p>
          <p className="relative mt-1 text-xs text-slate-400">Des livrables évalués</p>
        </Card>

        <Card className="relative overflow-hidden bg-white p-4 dark:bg-[#1f1f38]">
          <div className="absolute -right-6 -bottom-6 size-20 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400">
            Effectif Actif
          </p>
          <p className="relative mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.active_learners}/{stats.total_learners}
          </p>
          <p className="relative mt-1 text-xs text-slate-400">Apprenants engagés</p>
        </Card>

        <Card className="relative overflow-hidden bg-white p-4 dark:bg-[#1f1f38]">
          <div className="absolute -right-6 -bottom-6 size-20 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400">
            Note Moyenne
          </p>
          <p className="relative mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats.average_score !== null ? `${stats.average_score}/100` : '—'}
          </p>
          <p className="relative mt-1 text-xs text-slate-400">Sur tous les projets</p>
        </Card>
      </div>

      {/* 2. ALERTES APPRENANTS EN DIFFICULTÉ */}
      {stats.learners_at_risk && stats.learners_at_risk.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-50/30 p-5 dark:bg-amber-500/[0.02]">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-5" />
            <h3 className="font-bold">
              Apprenants nécessitant un accompagnement ({stats.learners_at_risk.length})
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Ces apprenants accusent un retard de progression ou ont plusieurs révisions en attente.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.learners_at_risk.map((learner) => (
              <div
                key={learner.enrollment_id}
                className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-white p-3 shadow-xs dark:border-white/10 dark:bg-[#1f1f38]"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {learner.full_name}
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    {learner.reason}
                  </p>
                </div>
                <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
                  {Math.round(learner.progress_percentage)}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. AVANCEMENT PAR PROJET */}
      <Card className="overflow-hidden bg-white p-0 shadow-sm dark:bg-[#1f1f38]">
        <div className="border-b border-slate-100 p-4 dark:border-white/5">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Avancement par Projet du Programme
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {stats.projects_stats.map((project) => (
            <div
              key={project.project_id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between text-xs"
            >
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-white">
                  {project.order}. {project.title}
                </p>
                <p className="text-slate-400">
                  {project.validated_count} validés • {project.revision_count} en révision • {project.pending_count} en attente
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-28 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Validation</span>
                    <span className="font-bold">{Math.round(project.validation_percentage)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${project.validation_percentage}%` }}
                    />
                  </div>
                </div>

                {project.average_score !== null ? (
                  <span className="rounded bg-slate-100 px-2 py-1 font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                    Moy. {project.average_score}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
