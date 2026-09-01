import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { FileCheck2, Github, Globe } from 'lucide-react'
import { getDeliverables } from '@/services/evaluations/evaluationService'
import type { Deliverable } from '@/types/evaluation'
import { ReviewDeliverableModal } from '@/components/evaluations/ReviewDeliverableModal'
import type { TrainerPendingReview } from '@/services/dashboard/dashboardService'

interface CohortDeliverablesTabProps {
  cohortId: string
  cohortName: string
}

export const CohortDeliverablesTab: React.FC<CohortDeliverablesTabProps> = ({
  cohortId,
  cohortName,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReview, setSelectedReview] = useState<TrainerPendingReview | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: deliverables = [], isLoading, refetch } = useQuery<Deliverable[]>({
    queryKey: ['deliverables', 'cohort', cohortId, statusFilter],
    queryFn: () =>
      getDeliverables({
        cohort: cohortId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    enabled: Boolean(cohortId),
  })

  const { data: allDeliverables = [] } = useQuery<Deliverable[]>({
    queryKey: ['deliverables', 'cohort', cohortId],
    queryFn: () => getDeliverables({ cohort: cohortId }),
    enabled: Boolean(cohortId),
  })

  const toReview = allDeliverables.filter((d) => d.status === 'submitted').length
  const validated = allDeliverables.filter((d) => d.status === 'validated').length
  const total = allDeliverables.length
  const validatedRate = total > 0 ? Math.round((validated / total) * 100) : 0

  const handleOpenReview = (deliv: Deliverable) => {
    setSelectedReview({
      deliverable_id: deliv.id,
      assignment_id: deliv.assignment,
      learner_id: deliv.submitted_by || '',
      learner_name: deliv.submitted_by_name || deliv.submitted_by_email || 'Apprenant',
      learner_email: deliv.submitted_by_email || '',
      cohort_id: cohortId,
      cohort_name: cohortName,
      project_title: 'Projet',
      version: deliv.version,
      submitted_at: deliv.submitted_at || null,
      repo_url: deliv.repo_url || '',
      live_url: deliv.live_url || '',
    })
    setModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* INDICATEURS */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="relative overflow-hidden bg-white p-4 dark:bg-[#1f1f38]">
          <div className="absolute -right-6 -bottom-6 size-20 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400">À corriger</p>
          <p className="relative mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{toReview}</p>
        </Card>
        <Card className="relative overflow-hidden bg-white p-4 dark:bg-[#1f1f38]">
          <div className="absolute -right-6 -bottom-6 size-20 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400">Validés</p>
          <p className="relative mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{validated}</p>
        </Card>
        <Card className="relative overflow-hidden bg-white p-4 dark:bg-[#1f1f38]">
          <div className="absolute -right-6 -bottom-6 size-20 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-400">Taux de validation</p>
          <p className="relative mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{validatedRate}%</p>
        </Card>
      </div>

      {/* FILTRES */}
      <div className="flex flex-wrap gap-2">
        {['all', 'submitted', 'validated', 'rejected'].map((st) => (
          <Button
            key={st}
            size="sm"
            variant={statusFilter === st ? 'default' : 'outline'}
            onClick={() => setStatusFilter(st)}
            className={statusFilter === st ? 'bg-[#FF6B0B] text-white hover:bg-[#e85f08]' : ''}
          >
            {st === 'all' && 'Tous les livrables'}
            {st === 'submitted' && 'À corriger'}
            {st === 'validated' && 'Validés'}
            {st === 'rejected' && 'À réviser'}
          </Button>
        ))}
      </div>

      {deliverables.length === 0 ? (
        <Card className="relative overflow-hidden bg-white p-8 text-center text-sm text-slate-500 dark:bg-[#1f1f38]">
          <div className="absolute -right-8 -bottom-8 size-28 rounded-full bg-[#FF6B0B]/5 blur-xl dark:bg-[#FF6B0B]/10" />
          <span className="relative">Aucun livrable ne correspond à ce filtre.</span>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-white p-0 shadow-sm dark:bg-[#1f1f38]">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {deliverables.map((deliv) => {
              const isSubmitted = deliv.status === 'submitted'
              const isValidated = deliv.status === 'validated'

              return (
                <div
                  key={deliv.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {deliv.submitted_by_name || deliv.submitted_by_email}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        v{deliv.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      {deliv.submitted_at && (
                        <span>
                          Déposé le {new Date(deliv.submitted_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {deliv.repo_url && (
                        <a
                          href={deliv.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-slate-600 hover:underline dark:text-slate-300"
                        >
                          <Github className="size-3" /> Code
                        </a>
                      )}
                      {deliv.live_url && (
                        <a
                          href={deliv.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:underline"
                        >
                          <Globe className="size-3" /> Démo
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {deliv.score !== null && deliv.score !== undefined && (
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {deliv.score}/20
                      </span>
                    )}

                    <Badge
                      variant="outline"
                      className={
                        isSubmitted
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-600'
                          : isValidated
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                          : 'border-red-500/20 bg-red-500/10 text-red-600'
                      }
                    >
                      {isSubmitted ? 'À corriger' : isValidated ? 'Validé' : 'À réviser'}
                    </Badge>

                    {isSubmitted && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(deliv)}
                        className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
                      >
                        <FileCheck2 className="mr-1.5 size-3.5" />
                        Corriger
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <ReviewDeliverableModal
        deliverable={selectedReview}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) refetch()
        }}
      />
    </div>
  )
}
