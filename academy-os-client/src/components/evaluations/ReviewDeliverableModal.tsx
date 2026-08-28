import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Github,
  Globe,
  Loader2,
} from 'lucide-react'
import { useDeliverableReview } from '@/hooks/useDeliverableReview'
import type { TrainerPendingReview } from '@/services/dashboard/dashboardService'

interface ReviewDeliverableModalProps {
  deliverable: TrainerPendingReview | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ReviewDeliverableModal: React.FC<ReviewDeliverableModalProps> = ({
  deliverable,
  open,
  onOpenChange,
}) => {
  const [status, setStatus] = useState<'validated' | 'rejected'>('validated')
  const [score, setScore] = useState<number>(80)
  const [feedback, setFeedback] = useState<string>('')

  const reviewMutation = useDeliverableReview(() => {
    onOpenChange(false)
    setFeedback('')
    setScore(80)
    setStatus('validated')
  })

  useEffect(() => {
    if (open) {
      setStatus('validated')
      setScore(80)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-slate-100 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                Correction : {deliverable.project_title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-500">
                Apprenant : <strong className="text-slate-900 dark:text-white">{deliverable.learner_name}</strong> • Cohorte : {deliverable.cohort_name} (v{deliverable.version})
              </DialogDescription>
            </div>
            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">
              En attente
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* LIENS ET INFORMATIONS DU LIVRABLE */}
          <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.01]">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ressources soumises par l’étudiant
            </p>
            <div className="flex flex-wrap gap-3">
              {deliverable.repo_url ? (
                <a
                  href={deliverable.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
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
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100/50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                >
                  <Globe className="size-4 text-blue-500" />
                  Démo en direct
                  <ExternalLink className="size-3 text-blue-400" />
                </a>
              ) : null}

              {!deliverable.repo_url && !deliverable.live_url && (
                <p className="text-xs text-slate-500">Aucun lien externe fourni.</p>
              )}
            </div>
          </div>

          {/* DÉCISION DE VALIDATION */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Décision de validation *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('validated')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-semibold transition-all ${
                  status === 'validated'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-sm dark:text-emerald-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400'
                }`}
              >
                <CheckCircle2 className="size-5 text-emerald-500" />
                Valider le projet
              </button>

              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-semibold transition-all ${
                  status === 'rejected'
                    ? 'border-red-500 bg-red-500/10 text-red-700 shadow-sm dark:text-red-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400'
                }`}
              >
                <XCircle className="size-5 text-red-500" />
                Demander des révisions
              </button>
            </div>
          </div>

          {/* NOTE ET FEEDBACK */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="score" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Note (/100) *
              </Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                required
                className="text-center font-bold"
              />
            </div>

            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="feedback" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Commentaires et conseils pédagogiques *
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Expliquez vos remarques, points forts et axes d'amélioration..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 dark:border-white/5">
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
              disabled={reviewMutation.isPending}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
