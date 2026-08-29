import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getAssignment,
  getAssignmentDeliverables,
  submitDeliverable,
} from '@/services/evaluations/evaluationService'
import type {
  ProjectAssignment,
  Deliverable,
  AssignmentStatus,
} from '@/types/evaluation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Clock,
  RotateCcw,
  Lock,
  FileText,
  Link2,
  Globe,
  MessageSquare,
  Paperclip,
  ExternalLink,
  Target,
} from 'lucide-react'

const STATUS_CONFIG: Record<
  AssignmentStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Verrouillé',
    className: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
  },
  in_progress: {
    label: 'En cours',
    className: 'bg-sky-500/10 text-sky-600',
  },
  submitted: {
    label: 'En attente de correction',
    className: 'bg-amber-500/10 text-amber-600',
  },
  validated: {
    label: 'Validé',
    className: 'bg-emerald-500/10 text-emerald-600',
  },
  rejected: {
    label: 'À réviser',
    className: 'bg-red-500/10 text-red-600',
  },
}

const DELIVERABLE_STATUS: Record<
  Deliverable['status'],
  { label: string; className: string }
> = {
  submitted: {
    label: 'En attente de correction',
    className: 'bg-amber-500/10 text-amber-600',
  },
  validated: {
    label: 'Validé',
    className: 'bg-emerald-500/10 text-emerald-600',
  },
  rejected: {
    label: 'À réviser',
    className: 'bg-red-500/10 text-red-600',
  },
}

const LEVEL_LABELS: Record<string, string> = {
  mastered: 'Maîtrisé',
  acquired: 'Acquis',
  in_progress: 'En cours',
  not_acquired: 'Non acquis',
}

const LEVEL_CLASSES: Record<string, string> = {
  mastered:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  acquired:
    'border-sky-500/20 bg-sky-500/10 text-sky-600',
  in_progress:
    'border-amber-500/20 bg-amber-500/10 text-amber-600',
  not_acquired:
    'border-red-500/20 bg-red-500/10 text-red-600',
}

const ProjectSubmissionPage: React.FC = () => {
  const { assignmentId = '' } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()

  const [assignment, setAssignment] =
    useState<ProjectAssignment | null>(null)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [repoUrl, setRepoUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [comments, setComments] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [assign, delivs] = await Promise.all([
        getAssignment(assignmentId),
        getAssignmentDeliverables(assignmentId),
      ])
      setAssignment(assign)
      setDeliverables(delivs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [assignmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim() && !liveUrl.trim() && files.length === 0) {
      toast.error(
        'Ajoutez au moins un fichier ou un lien pour soumettre votre livrable.',
      )
      return
    }
    setSubmitting(true)
    try {
      const created = await submitDeliverable(assignmentId, {
        repo_url: repoUrl.trim() || undefined,
        live_url: liveUrl.trim() || undefined,
        comments: comments.trim() || undefined,
        files,
      })
      toast.success('Livrable soumis avec succès !')
      setDeliverables((prev) => [created, ...prev])
      setRepoUrl('')
      setLiveUrl('')
      setComments('')
      setFiles([])
    } catch {
      toast.error(
        "Échec de la soumission. Vérifiez vos fichiers (max 10 Mo chacun) puis réessayez.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    assignment?.status === 'in_progress' ||
    assignment?.status === 'rejected'

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <Card className="flex h-96 flex-col items-center justify-center gap-4 bg-white p-8 text-center shadow-sm dark:bg-[#1f1f38]">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <FileText className="size-6" />
        </div>
        <p className="text-sm text-slate-500">
          Impossible de charger ce projet.
        </p>
        <Button variant="outline" onClick={() => void load()}>
          Réessayer
        </Button>
      </Card>
    )
  }

  const status =
    STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.pending
  const latest = deliverables[0]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* BREADCRUMB + TITLE */}
      <div>
        <Link
          to="/formations"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#FF6B0B]"
        >
          <ArrowLeft className="size-4" />
          Retour à ma formation
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FF6B0B]">
                Projet {assignment.project_order ?? '—'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${status.className}`}
              >
                {assignment.status === 'validated' && (
                  <CheckCircle2 className="size-3.5" />
                )}
                {assignment.status === 'rejected' && (
                  <RotateCcw className="size-3.5" />
                )}
                {assignment.status === 'submitted' && (
                  <Clock className="size-3.5" />
                )}
                {assignment.status === 'pending' && (
                  <Lock className="size-3.5" />
                )}
                {status.label}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {assignment.project_title ?? 'Projet'}
            </h1>
            {assignment.final_score !== null &&
              assignment.final_score !== undefined && (
                <p className="mt-1 text-sm text-slate-500">
                  Note finale : {assignment.final_score}/100
                </p>
              )}
            {assignment.deadline_override && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="size-3.5" />
                À rendre avant le{' '}
                {new Date(assignment.deadline_override).toLocaleDateString(
                  'fr-FR',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  },
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STATUT VERROUILLÉ */}
      {assignment.status === 'pending' && (
        <Card className="flex items-center gap-3 bg-white p-5 shadow-sm dark:bg-[#1f1f38]">
          <Lock className="size-5 text-slate-400" />
          <p className="text-sm text-slate-500">
            Ce projet sera débloqué lorsque le projet précédent sera
            validé.
          </p>
        </Card>
      )}

      {/* FORMULAIRE DE DÉPÔT */}
      {canSubmit && (
        <Card className="bg-white p-6 shadow-sm dark:bg-[#1f1f38]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
              <Upload className="size-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Déposer mon livrable
              </h2>
              <p className="text-xs text-slate-500">
                Fichiers max 10 Mo chacun. Vous pouvez soumettre à
                nouveau en cas de refus.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="repo">Lien du dépôt (Git)</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="live">Lien de démonstration</Label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="live"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Commentaires</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Précisez ce que vous avez réalisé, vos éventuels choix techniques..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Fichiers joints</Label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center transition-colors hover:border-[#FF6B0B]/50 dark:border-white/10">
                <Paperclip className="size-6 text-slate-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {files.length > 0
                    ? `${files.length} fichier(s) sélectionné(s)`
                    : 'Cliquez pour ajouter des fichiers'}
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    setFiles(Array.from(e.target.files ?? []))
                  }
                />
              </label>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-500"
                    >
                      <FileText className="size-3.5 text-[#FF6B0B]" />
                      {f.name}{' '}
                      <span className="text-slate-400">
                        ({(f.size / 1024).toFixed(0)} Ko)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
              >
                <Upload className="mr-2 size-4" />
                {submitting ? 'Envoi en cours...' : 'Soumettre mon livrable'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {assignment.status === 'submitted' && (
        <Card className="flex items-center gap-3 bg-white p-5 shadow-sm dark:bg-[#1f1f38]">
          <Clock className="size-5 text-amber-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Votre livrable est en attente de correction par votre
            formateur.
          </p>
        </Card>
      )}

      {assignment.status === 'validated' && (
        <Card className="flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm dark:bg-[#1f1f38]">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Projet validé !
            </p>
            <p className="text-emerald-600/80 dark:text-emerald-400/70">
              Félicitations, vous pouvez passer au projet suivant.
            </p>
          </div>
        </Card>
      )}

      {/* HISTORIQUE DES RETOURS */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-white/5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              Historique des livrables et retours
            </h2>
            <p className="text-xs text-slate-500">
              {latest
                ? 'Dernière soumission en tête de liste'
                : "Aucun livrable soumis pour le moment"}
            </p>
          </div>
        </div>

        {deliverables.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Vous n'avez pas encore soumis de livrable pour ce projet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {deliverables.map((deliv) => {
              const dStatus =
                DELIVERABLE_STATUS[deliv.status] ??
                DELIVERABLE_STATUS.submitted
              return (
                <div key={deliv.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                        v{deliv.version}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${dStatus.className}`}
                      >
                        {deliv.status === 'validated' && (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {deliv.status === 'rejected' && (
                          <RotateCcw className="size-3.5" />
                        )}
                        {deliv.status === 'submitted' && (
                          <Clock className="size-3.5" />
                        )}
                        {dStatus.label}
                      </span>
                      {deliv.score !== null &&
                        deliv.score !== undefined && (
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                            {deliv.score}/100
                          </span>
                        )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {deliv.submitted_at
                        ? new Date(deliv.submitted_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          )
                        : ''}
                    </span>
                  </div>

                  {(deliv.repo_url || deliv.live_url || deliv.comments) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {deliv.repo_url && (
                        <a
                          href={deliv.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300"
                        >
                          <Link2 className="size-3.5" /> Dépôt
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      {deliv.live_url && (
                        <a
                          href={deliv.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300"
                        >
                          <Globe className="size-3.5" /> Démo
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      {deliv.comments && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                          <MessageSquare className="size-3.5" />
                          {deliv.comments}
                        </span>
                      )}
                    </div>
                  )}

                  {deliv.feedback && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Retour du formateur
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {deliv.feedback}
                      </p>
                    </div>
                  )}

                  {deliv.criterion_scores &&
                    deliv.criterion_scores.length > 0 && (
                      <details className="mt-3 rounded-xl bg-slate-50 dark:bg-white/5">
                        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Target className="size-3.5" />
                          Détail de la correction par compétence
                        </summary>
                        <div className="space-y-2 px-4 pb-4">
                          {deliv.criterion_scores.map((cs) => {
                            const levelClass =
                              LEVEL_CLASSES[cs.level ?? ''] ??
                              LEVEL_CLASSES.in_progress
                            const levelLabel =
                              LEVEL_LABELS[cs.level ?? ''] ??
                              cs.level
                            return (
                              <div
                                key={cs.criterion}
                                className="rounded-lg bg-white p-3 dark:bg-[#1f1f38]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {cs.criterion_title ?? 'Critère'}
                                  </p>
                                  {cs.score !== undefined && (
                                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                      {cs.score}/{cs.max_score ?? '—'}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  {cs.level && (
                                    <Badge
                                      variant="outline"
                                      className={`${levelClass} shrink-0`}
                                    >
                                      {levelLabel}
                                    </Badge>
                                  )}
                                  {cs.competency_name && (
                                    <span className="text-xs text-slate-400">
                                      {cs.competency_name}
                                    </span>
                                  )}
                                </div>
                                {cs.feedback && (
                                  <p className="mt-2 text-sm text-slate-500">
                                    {cs.feedback}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Retour
        </Button>
      </div>
    </div>
  )
}

export default ProjectSubmissionPage
