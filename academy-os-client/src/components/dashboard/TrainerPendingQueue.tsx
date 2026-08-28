import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileCheck2, Clock, Github, Globe, CheckCircle2 } from 'lucide-react'
import type { TrainerPendingReview } from '@/services/dashboard/dashboardService'
import { ReviewDeliverableModal } from '@/components/evaluations/ReviewDeliverableModal'

interface TrainerPendingQueueProps {
  pendingReviews: TrainerPendingReview[]
}

export const TrainerPendingQueue: React.FC<TrainerPendingQueueProps> = ({
  pendingReviews,
}) => {
  const [selectedReview, setSelectedReview] = useState<TrainerPendingReview | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleOpenReview = (review: TrainerPendingReview) => {
    setSelectedReview(review)
    setModalOpen(true)
  }

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151528]">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
              <FileCheck2 className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                File d'attente des corrections
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Livrables soumis par vos apprenants nécessitant une évaluation
              </p>
            </div>
          </div>
          <Badge className="bg-[#FF6B0B] text-white">
            {pendingReviews.length} en attente
          </Badge>
        </div>

        {pendingReviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
              Toutes les corrections sont à jour !
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Aucun nouveau livrable n'est actuellement en attente d'évaluation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {pendingReviews.map((review) => {
              const formattedDate = review.submitted_at
                ? new Date(review.submitted_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Récemment'

              return (
                <div
                  key={review.deliverable_id}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-white/[0.01]"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {review.project_title}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        v{review.version}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      <strong className="text-slate-800 dark:text-slate-200">
                        {review.learner_name}
                      </strong>{' '}
                      ({review.learner_email}) • Cohorte :{' '}
                      <span className="font-medium text-[#FF6B0B]">
                        {review.cohort_name}
                      </span>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        Soumis le {formattedDate}
                      </span>
                      {review.repo_url && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Github className="size-3.5" />
                          Code disponible
                        </span>
                      )}
                      {review.live_url && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <Globe className="size-3.5" />
                          Démo en ligne
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      onClick={() => handleOpenReview(review)}
                      className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
                    >
                      <FileCheck2 className="mr-2 size-4" />
                      Évaluer & Corriger
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <ReviewDeliverableModal
        deliverable={selectedReview}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
