import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Upload,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

import { ReviewDeliverableModal } from '@/components/evaluations/ReviewDeliverableModal'

import {
  getAssignments,
  getAssignmentDeliverables,
} from '@/services/evaluations/evaluationService'

import type { TrainerPendingReview } from '@/services/dashboard/dashboardService'

import type {
  ProjectAssignment,
  Deliverable,
} from '@/types/evaluation'

type AssignmentStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'validated'
  | 'rejected'

const STATUS_CONFIG: Record<
  AssignmentStatus,
  {
    label: string
    className: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  pending: {
    label: 'Verrouillé',
    className:
      'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
    icon: Lock,
  },

  in_progress: {
    label: 'En cours',
    className:
      'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    icon: Clock,
  },

  submitted: {
    label: 'À corriger',
    className:
      'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    icon: Clock,
  },

  validated: {
    label: 'Validé',
    className:
      'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    icon: CheckCircle2,
  },

  rejected: {
    label: 'À resoumettre',
    className:
      'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    icon: XCircle,
  },
}

const EvaluationsPage: React.FC = () => {
  const { user } = useAuth()

  const isTrainer = user?.role === 'trainer'
  const isLearner = user?.role === 'learner'
  const isAdmin = user?.role === 'admin'

  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [deliverables, setDeliverables] = useState<
    Record<string, Deliverable[]>
  >({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getAssignments()

      setAssignments(data)

      const deliverablesMap: Record<string, Deliverable[]> = {}

      await Promise.all(
        data.map(async (assignment) => {
          try {
            const items = await getAssignmentDeliverables(
              assignment.id,
            )

            deliverablesMap[assignment.id] = items
          } catch (err) {
            console.error(
              `Erreur livrables assignment ${assignment.id}`,
              err,
            )

            deliverablesMap[assignment.id] = []
          }
        }),
      )

      setDeliverables(deliverablesMap)
    } catch (err) {
      console.error('Erreur chargement évaluations:', err)

      setError(
        "Impossible de charger les données d'évaluation.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [])

  const totalAssignments = assignments.length

  const validatedAssignments = assignments.filter(
    (assignment) => assignment.status === 'validated',
  ).length

  const submittedAssignments = assignments.filter(
    (assignment) => assignment.status === 'submitted',
  ).length

  const totalDeliverables = Object.values(deliverables).reduce(
    (total, items) => total + items.length,
    0,
  )

  const progression = useMemo(() => {
    if (totalAssignments === 0) return 0

    return Math.round(
      (validatedAssignments / totalAssignments) * 100,
    )
  }, [totalAssignments, validatedAssignments])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-7 animate-spin text-[#FF6B0B]" />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chargement des évaluations...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            Évaluations
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gestion des projets et des livrables.
          </p>
        </div>

        <Card className="rounded-2xl border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />

            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                Erreur de chargement
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>

              <Button
                onClick={loadAssignments}
                variant="outline"
                className="mt-4"
              >
                Réessayer
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B0B]/10">
            <ClipboardCheck className="size-7 text-[#FF6B0B]" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Évaluations
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isTrainer
                ? 'Corrigez les livrables et accompagnez les apprenants dans leur progression.'
                : isLearner
                  ? 'Suivez vos projets, soumettez vos livrables et consultez vos résultats.'
                  : 'Gérez et suivez les évaluations de l’académie.'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardCheck}
          label="Assignations"
          value={totalAssignments}
          description="Projets assignés"
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        />

        <KpiCard
          icon={FileCheck2}
          label="Livrables"
          value={totalDeliverables}
          description="Livrables soumis"
          iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
        />

        <KpiCard
          icon={CheckCircle2}
          label="Validés"
          value={validatedAssignments}
          description="Projets validés"
          iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
        />

        <KpiCard
          icon={isTrainer ? Clock : CheckCircle2}
          label={isTrainer ? 'À corriger' : 'Progression'}
          value={isTrainer ? submittedAssignments : `${progression}%`}
          description={
            isTrainer
              ? 'Livrables en attente'
              : 'Parcours complété'
          }
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        />
      </div>

      {/* APPRENANT */}
      {isLearner && (
        <LearnerView
          assignments={assignments}
          deliverables={deliverables}
        />
      )}

      {/* FORMATEUR */}
      {isTrainer && (
        <TrainerView
          assignments={assignments}
          deliverables={deliverables}
          onRefresh={loadAssignments}
        />
      )}

      {/* ADMIN */}
      {isAdmin && (
        <AdminView assignments={assignments} />
      )}

      {/* ROLE INCONNU */}
      {!isLearner && !isTrainer && !isAdmin && (
        <Card className="rounded-2xl border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#151528]">
          <AlertCircle className="mx-auto size-8 text-amber-500" />

          <h2 className="mt-3 font-bold text-slate-900 dark:text-white">
            Rôle non reconnu
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Votre rôle ne permet pas encore d'afficher cette
            section.
          </p>
        </Card>
      )}
    </div>
  )
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  description: string
  iconClass: string
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) => {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#151528]">
      <div className="flex items-center justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="size-5" />
        </div>

        <span className="text-xs font-medium text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </Card>
  )
}

interface LearnerViewProps {
  assignments: ProjectAssignment[]
  deliverables: Record<string, Deliverable[]>
}

const LearnerView: React.FC<LearnerViewProps> = ({
  assignments,
  deliverables,
}) => {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151528]">
      <div className="border-b border-slate-200 p-5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
            <ClipboardCheck className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              Mes projets
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Les projets sont débloqués progressivement après
              validation.
            </p>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="Aucun projet assigné"
          description="Aucun projet ne vous a encore été assigné."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {assignments.map((assignment, index) => {
            const status =
              STATUS_CONFIG[
                assignment.status as AssignmentStatus
              ] ?? STATUS_CONFIG.pending

            const StatusIcon = status.icon

            const assignmentDeliverables =
              deliverables[assignment.id] ?? []

            const canSubmit =
              assignment.status === 'in_progress' ||
              assignment.status === 'rejected'

            return (
              <div key={assignment.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                        assignment.status === 'pending'
                          ? 'bg-slate-100 text-slate-400 dark:bg-white/5'
                          : 'bg-[#FF6B0B]/10 text-[#FF6B0B]'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {assignment.project_title ??
                          `Projet ${index + 1}`}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                        >
                          <StatusIcon className="size-3.5" />
                          {status.label}
                        </span>

                        {assignment.final_score !==
                          undefined &&
                          assignment.final_score !== null && (
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Note : {assignment.final_score}
                            </span>
                          )}
                      </div>

                      {assignmentDeliverables.length > 0 && (
                        <p className="mt-2 text-xs text-slate-400">
                          {assignmentDeliverables.length}{' '}
                          version
                          {assignmentDeliverables.length > 1
                            ? 's'
                            : ''}{' '}
                          soumise
                          {assignmentDeliverables.length > 1
                            ? 's'
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {canSubmit && (
                      <Button
                        className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
                        onClick={() =>
                          navigate(`/formations/projets/${assignment.id}`)
                        }
                      >
                        <Upload className="mr-2 size-4" />

                        {assignment.status === 'rejected'
                          ? 'Resoumettre'
                          : 'Soumettre'}
                      </Button>
                    )}

                    {assignment.status === 'pending' && (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Lock className="size-4" />
                        Projet verrouillé
                      </div>
                    )}

                    {assignment.status === 'submitted' && (
                      <span className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="size-4" />
                        En attente de correction
                      </span>
                    )}

                    {assignment.status === 'validated' && (
                      <span className="flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-400">
                        <CheckCircle2 className="size-4" />
                        Projet terminé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

interface TrainerViewProps {
  assignments: ProjectAssignment[]
  deliverables: Record<string, Deliverable[]>
  onRefresh?: () => void
}

const TrainerView: React.FC<TrainerViewProps> = ({
  assignments,
  deliverables,
  onRefresh,
}) => {
  const [selectedReview, setSelectedReview] = useState<TrainerPendingReview | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const submittedAssignments = assignments.filter(
    (assignment) => assignment.status === 'submitted',
  )

  const handleOpenReview = (assignment: ProjectAssignment, latestDeliverable?: Deliverable) => {
    if (!latestDeliverable) return

    setSelectedReview({
      deliverable_id: latestDeliverable.id,
      assignment_id: assignment.id,
      learner_id: assignment.enrollment || '',
      learner_name: assignment.user_name || 'Apprenant',
      learner_email: assignment.user_email || '',
      cohort_id: assignment.cohort_id || '',
      cohort_name: assignment.cohort_name || 'Cohorte',
      project_title: assignment.project_title || 'Projet',
      version: latestDeliverable.version,
      submitted_at: latestDeliverable.submitted_at || null,
      repo_url: latestDeliverable.repo_url || '',
      live_url: latestDeliverable.live_url || '',
    })
    setModalOpen(true)
  }

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151528]">
        <div className="border-b border-slate-200 p-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
              <Users className="size-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Livrables à corriger
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Les livrables soumis par vos apprenants apparaissent ici.
              </p>
            </div>
          </div>
        </div>

        {submittedAssignments.length === 0 ? (
          <EmptyState
            title="Aucun livrable à corriger"
            description="Les nouveaux livrables soumis apparaîtront ici."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {submittedAssignments.map((assignment) => {
              const items = deliverables[assignment.id] ?? []
              const latestDeliverable = items[items.length - 1]

              return (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {assignment.project_title ?? 'Projet'}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {assignment.user_name ?? 'Apprenant'}
                    </p>

                    {latestDeliverable && (
                      <p className="mt-1 text-xs text-slate-400">
                        Dernière version : v{latestDeliverable.version}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => handleOpenReview(assignment, latestDeliverable)}
                    disabled={!latestDeliverable}
                    className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
                  >
                    <FileCheck2 className="mr-2 size-4" />
                    Corriger
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <ReviewDeliverableModal
        deliverable={selectedReview}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) onRefresh?.()
        }}
      />
    </>
  )
}

interface AdminViewProps {
  assignments: ProjectAssignment[]
}

const AdminView: React.FC<AdminViewProps> = ({
  assignments,
}) => {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151528]">
      <div className="border-b border-slate-200 p-5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
            <ClipboardCheck className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              Vue globale des évaluations
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Suivez les assignations et l'avancement des apprenants.
            </p>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          title="Aucune assignation"
          description="Aucune assignation de projet n'est disponible."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {assignments.map((assignment) => {
            const status =
              STATUS_CONFIG[
                assignment.status as AssignmentStatus
              ] ?? STATUS_CONFIG.pending

            const StatusIcon = status.icon

            return (
              <div
                key={assignment.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {assignment.project_name ?? 'Projet'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {assignment.learner_name ?? 'Apprenant'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {assignment.final_score !==
                    undefined &&
                    assignment.final_score !== null && (
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {assignment.final_score}
                      </span>
                    )}

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                  >
                    <StatusIcon className="size-3.5" />
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

interface EmptyStateProps {
  title: string
  description: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
}) => {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-white/5">
        <ClipboardCheck className="size-5" />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}

export default EvaluationsPage

