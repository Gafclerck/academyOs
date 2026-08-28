import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAssignments } from '@/services/evaluations/evaluationService'
import type {
  ProjectAssignment,
  AssignmentStatus,
} from '@/types/evaluation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  BookOpen,
  ArrowRight,
  Lock,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  FolderGit2,
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

const MaFormationPage: React.FC = () => {
  const [assignments, setAssignments] = useState<
    ProjectAssignment[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getAssignments()
      const sorted = [...data].sort(
        (a, b) => (a.project_order ?? 0) - (b.project_order ?? 0),
      )
      setAssignments(sorted)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const validatedCount = assignments.filter(
    (a) => a.status === 'validated',
  ).length
  const pct =
    assignments.length > 0
      ? Math.round((validatedCount / assignments.length) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Ma Formation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Votre parcours de projets, débloqué progressivement.
          </p>
        </div>
        <Button
          onClick={load}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2 self-start rounded-xl border-slate-200 dark:border-white/10"
        >
          <RefreshCw className="size-3.5" />
          Actualiser
        </Button>
      </div>

      {/* PROGRESSION */}
      {assignments.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Progression
            </span>
            <span className="text-slate-500">
              {validatedCount}/{assignments.length} projets validés
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#FF6B0B] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="flex h-64 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertCircle className="size-6" />
          </div>
          <p className="text-sm text-slate-500">
            Impossible de charger votre parcours de formation.
          </p>
          <Button onClick={load} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
        </Card>
      ) : assignments.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5">
            <BookOpen className="size-6" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
            Aucun projet assigné
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Votre parcours sera débloqué dès qu'un formateur vous
            assigne des projets.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((assignment, index) => {
            const status =
              STATUS_CONFIG[assignment.status] ??
              STATUS_CONFIG.pending
            const isLocked = assignment.status === 'pending'

            return (
              <Card
                key={assignment.id}
                className="group flex flex-col overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151528]"
              >
                <div className="flex items-center justify-between p-5 pb-0">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 font-extrabold text-[#FF6B0B]">
                    {assignment.project_order ?? index + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
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

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {assignment.project_title ??
                      `Projet ${assignment.project_order ?? index + 1}`}
                  </h3>

                  {assignment.final_score !== null &&
                    assignment.final_score !== undefined && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Note finale : {assignment.final_score}/100
                      </p>
                    )}

                  <div className="mt-auto pt-4">
                    {isLocked ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Lock className="size-4" />
                        Terminez le projet précédent pour débloquer
                      </div>
                    ) : (
                      <Link to={`/formations/projets/${assignment.id}`}>
                        <Button
                          className="w-full bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
                          size="sm"
                        >
                          {assignment.status === 'validated'
                            ? 'Voir le suivi'
                            : 'Ouvrir le projet'}
                          <ArrowRight className="ml-2 size-4" />
                        </Button>
                      </Link>
                    )}

                    {assignment.status === 'validated' && (
                      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="size-4" />
                        Projet terminé
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* FOOTER */}
      <Card className="flex items-center gap-3 p-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5">
          <FolderGit2 className="size-4" />
        </div>
        <p className="text-sm text-slate-500">
          Chaque projet validé débloque le suivant. Pour soumettre
          un livrable, ouvrez le projet puis déposez vos fichiers et
          liens.
        </p>
      </Card>
    </div>
  )
}

export default MaFormationPage
