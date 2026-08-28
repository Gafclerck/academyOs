import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, History, XCircle } from 'lucide-react'
import type { TrainerRecentReview } from '@/services/dashboard/dashboardService'

interface TrainerRecentReviewsProps {
  recentReviews: TrainerRecentReview[]
}

export const TrainerRecentReviews: React.FC<TrainerRecentReviewsProps> = ({
  recentReviews,
}) => {
  if (!recentReviews || recentReviews.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#151528]">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <History className="size-4" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">
            Dernières corrections effectuées
          </h2>
          <p className="text-xs text-slate-500">
            Historique récent de vos évaluations notées
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-100 dark:divide-white/5">
        {recentReviews.map((review, index) => {
          const isValidated = review.status === 'validated'
          const formattedDate = review.reviewed_at
            ? new Date(review.reviewed_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
              })
            : ''

          return (
            <div
              key={review.deliverable_id || index}
              className="flex items-center justify-between py-3 text-xs"
            >
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-white">
                  {review.learner_name} • {review.project_title}
                </p>
                <p className="text-slate-400">
                  {review.cohort_name} • Évalué le {formattedDate}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {review.score !== null && review.score !== undefined ? (
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {review.score}/100
                  </span>
                ) : null}

                <Badge
                  variant="outline"
                  className={
                    isValidated
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                      : 'border-red-500/20 bg-red-500/10 text-red-600'
                  }
                >
                  {isValidated ? (
                    <>
                      <CheckCircle2 className="mr-1 size-3" />
                      Validé
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 size-3" />
                      À réviser
                    </>
                  )}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
