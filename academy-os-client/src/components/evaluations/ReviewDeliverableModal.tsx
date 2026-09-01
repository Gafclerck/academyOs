import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Github,
  Globe,
  Loader2,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import { useDeliverableReview } from '@/hooks/useDeliverableReview'
import type { TrainerPendingReview } from '@/services/dashboard/dashboardService'

interface ReviewDeliverableModalProps {
  deliverable: TrainerPendingReview | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SCORE_MIN = 0
const SCORE_MAX = 20
const SCORE_STEP = 0.5

const fmtDate = (value: string | null) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const clampScore = (value: number) =>
  Math.min(SCORE_MAX, Math.max(SCORE_MIN, value))

export const ReviewDeliverableModal: React.FC<ReviewDeliverableModalProps> = ({
  deliverable,
  open,
  onOpenChange,
}) => {
  const [status, setStatus] = useState<'validated' | 'rejected'>('validated')
  const [score, setScore] = useState<number>(16)
  const [feedback, setFeedback] = useState<string>('')

  const reviewMutation = useDeliverableReview(() => {
    onOpenChange(false)
    setFeedback('')
    setScore(16)
    setStatus('validated')
  })

  useEffect(() => {
    if (open) {
      setStatus('validated')
      setScore(16)
      setFeedback('')
    }
  }, [open, deliverable?.deliverable_id])

  if (!deliverable) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    reviewMutation.mutate({
      deliverableId: deliverable.deliverable_id,
      data: {
        status,
        score: Number(score),
        feedback,
      },
    })
  }

  const handleScoreChange = (value: number) => {
    if (!Number.isFinite(value)) {
      setScore(SCORE_MIN)
      return
    }

    setScore(clampScore(value))
  }

  const scoreValid =
    score >= SCORE_MIN && score <= SCORE_MAX

  const canSubmit =
    status === 'validated' ||
    status === 'rejected'

  const submitDisabled =
    reviewMutation.isPending ||
    !scoreValid ||
    !feedback.trim() ||
    !canSubmit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden p-0 sm:max-w-3xl"
      >
        {/* HEADER */}
        <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-6 py-5 dark:border-white/10 dark:bg-[#1f1f38]">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div className="min-w-0">
              <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                Correction : {deliverable.project_title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {deliverable.learner_name}
                {deliverable.learner_email ? (
                  <span className="text-slate-400 dark:text-slate-500"> ({deliverable.learner_email})</span>
                ) : null}{' '}
                • Cohorte : {deliverable.cohort_name} • v
                {deliverable.version} • Soumis le{' '}
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  {fmtDate(deliverable.submitted_at)}
                </strong>
              </DialogDescription>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              En attente de correction
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
            className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 dark:border-white/10 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* CORPS SCROLLABLE */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* RESSOURCES SOUMISES */}
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ressources soumises par l'étudiant
              </p>

              <div className="flex flex-wrap gap-3">
                {deliverable.repo_url ? (
                  <a
                    href={deliverable.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    <Github className="size-4 text-slate-900 dark:text-white" />
                    Dépôt GitHub
                    <ExternalLink className="size-3 text-slate-400" />
                  </a>
                ) : null}

                {deliverable.live_url ? (
                  <a
                    href={deliverable.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                  >
                    <Globe className="size-4 text-blue-500" />
                    Démo en direct
                    <ExternalLink className="size-3 text-blue-400" />
                  </a>
                ) : null}

                {!deliverable.repo_url && !deliverable.live_url && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aucun lien externe fourni.
                  </p>
                )}
              </div>
            </section>

            {/* DÉCISION DE VALIDATION */}
            <section className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Décision de validation *
              </Label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStatus('validated')}
                  className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-semibold transition-all ${
                    status === 'validated'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-sm ring-2 ring-emerald-500/30 dark:text-emerald-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                  <span className="min-w-0">
                    <span className="block">Valider le projet</span>
                    <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      Le livrable est accepté tel quel (avec la note ci-dessous)
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('rejected')}
                  className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-semibold transition-all ${
                    status === 'rejected'
                      ? 'border-red-500 bg-red-500/10 text-red-700 shadow-sm ring-2 ring-red-500/30 dark:text-red-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400'
                  }`}
                >
                  <XCircle className="size-5 shrink-0 text-red-500" />
                  <span className="min-w-0">
                    <span className="block">Demander des révisions</span>
                    <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      Le livrable est renvoyé à l'étudiant pour corrections
                    </span>
                  </span>
                </button>
              </div>
            </section>

            {/* NOTE ET FEEDBACK */}
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="score" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Note (/20) *
                  </Label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleScoreChange(score - SCORE_STEP)}
                      disabled={reviewMutation.isPending || score <= SCORE_MIN}
                      aria-label="Diminuer la note"
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                    >
                      <Minus className="size-4" />
                    </button>

                    <Input
                      id="score"
                      type="number"
                      min={SCORE_MIN}
                      max={SCORE_MAX}
                      value={score}
                      onChange={(e) => handleScoreChange(Number(e.target.value))}
                      className="h-9 min-w-0 flex-1 text-center font-bold"
                    />

                    <button
                      type="button"
                      onClick={() => handleScoreChange(score + SCORE_STEP)}
                      disabled={reviewMutation.isPending || score >= SCORE_MAX}
                      aria-label="Augmenter la note"
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Entre {SCORE_MIN} et {SCORE_MAX}
                  </p>

                  {!scoreValid && (
                    <p className="text-[11px] font-semibold text-red-500">
                      La note doit être comprise entre {SCORE_MIN} et {SCORE_MAX}.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Commentaires et conseils pédagogiques *
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Expliquez vos remarques, points forts et axes d'amélioration..."
                    rows={4}
                    className="min-h-[92px] resize-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 border-t border-slate-200 px-6 py-4 dark:border-white/10">
            {reviewMutation.error && (
              <p className="mb-3 text-sm font-semibold text-red-500">
                {reviewMutation.error.message ||
                  'Erreur lors de l\u2019enregistrement de la correction.'}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={reviewMutation.isPending}
              >
                Annuler
              </Button>

              <Button
                type="submit"
                disabled={submitDisabled}
                className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
              >
                {reviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer la correction'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}