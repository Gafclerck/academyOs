import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLearnerDashboard } from '@/hooks/useLearnerDashboard'
import { useFormations } from '@/hooks/useFormations'
import FormationSelector from '@/components/formations/FormationSelector'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  RefreshCw,
  AlertCircle,
  GraduationCap,
  UserCheck,
  ArrowRight,
  FolderGit2,
  Award,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'

const roundPct = (value?: number) => Math.round(value || 0)

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

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth()
  const { cohorts, selectedCohortId, setSelectedCohortId } =
    useFormations()
  const { data, isLoading, error, refetch } = useLearnerDashboard(
    selectedCohortId ?? undefined,
  )

  const firstName = user?.first_name || 'Apprenant'

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-xs text-slate-400">Chargement de votre espace d'apprentissage...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Erreur de synchronisation
          </h3>
          <p className="text-sm text-slate-500">
            Impossible de récupérer votre progression.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="size-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  const pct = roundPct(data.progress_percentage)
  const current = data.current_project
  const hasEnrollment = data.has_enrollment
  const recentDeliverables = Array.isArray(data.recent_deliverables)
    ? data.recent_deliverables
    : []
  const competencyScores = Array.isArray(data.competency_scores)
    ? data.competency_scores
    : []

  return (
    <div className="space-y-8">
      {/* HEADER DE BIENVENUE */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {hasEnrollment && data.program_name
              ? `${data.program_name} • Cohorte ${data.cohort_name}`
              : 'Voici un aperçu de votre formation'}
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="gap-2 self-start rounded-xl border-slate-200 dark:border-white/10"
        >
          <RefreshCw className="size-3.5" />
          Actualiser
        </Button>
      </div>

      {/* SÉLECTEUR DE FORMATION */}
      <FormationSelector
        cohorts={cohorts}
        selectedCohortId={selectedCohortId}
        onSelect={setSelectedCohortId}
      />

      {!hasEnrollment ? (
        <Card className="bg-white p-10 text-center shadow-sm dark:bg-[#1f1f38]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5">
            <GraduationCap className="size-6" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
            Aucune inscription active
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Vous n'êtes actuellement rattaché à aucune cohorte en cours.
          </p>
        </Card>
      ) : (
        <>
          {/* 1. PROGRESSION + MENTOR */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Card className="bg-white p-5 shadow-sm lg:col-span-2 dark:bg-[#1f1f38]">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Progression de la formation
              </p>
              <div className="mt-4 flex items-center gap-5">
                <div className="relative flex size-24 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="10"
                      className="stroke-slate-100 dark:stroke-white/10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                      className="stroke-[#FF6B0B]"
                    />
                  </svg>
                  <span className="absolute text-xl font-extrabold text-slate-900 dark:text-white">
                    {pct}%
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">
                      {data.validated_projects}
                    </strong>{' '}
                    / {data.total_projects} projets validés
                  </p>
                  <p className="text-slate-500">
                    Note moyenne :{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {data.average_score !== null ? `${data.average_score}/20` : '—'}
                    </strong>
                  </p>
                  {data.certificate_status && (
                    <p className="text-xs text-[#FF6B0B]">
                      Éligibilité certificat : {data.certificate_status}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-white p-5 shadow-sm lg:col-span-2 dark:bg-[#1f1f38]">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Votre Mentor
              </p>
              {data.mentor_name ? (
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <UserCheck className="size-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {data.mentor_name}
                    </p>
                    <a
                      href={`mailto:${data.mentor_email ?? ''}`}
                      className="text-sm text-slate-500 hover:text-[#FF6B0B]"
                    >
                      {data.mentor_email}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Aucun mentor ne vous a encore été assigné.
                </p>
              )}
            </Card>
          </div>

          {/* 2. PROJET ACTIF */}
          {current && (
            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
                    <FolderGit2 className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Projet {current.order} • En cours
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {current.title}
                    </h2>
                    {current.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {current.description}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  to={`/formations/projets/${current.assignment_id}`}
                  className="shrink-0"
                >
                  <Button className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]">
                    Continuer mon projet
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* 3. COMPÉTENCES */}
          {competencyScores.length > 0 && (
            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
              <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-white/5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <GraduationCap className="size-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    Compétences
                  </h2>
                  <p className="text-xs text-slate-500">
                    Niveaux d'acquisition estimés sur vos livrables
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                {competencyScores.map((comp) => {
                  const levelClass =
                    LEVEL_CLASSES[comp.latest_level] ??
                    LEVEL_CLASSES.in_progress
                  const levelLabel =
                    LEVEL_LABELS[comp.latest_level] ??
                    comp.latest_level
                  return (
                    <div
                      key={comp.competency_name}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {comp.competency_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Moyenne :{' '}
                          {comp.average_score !== null &&
                          comp.average_score !== undefined
                            ? `${comp.average_score}/20`
                            : '—'}
                        </p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${levelClass}`}>
                        {levelLabel}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* 4. DERNIERS FEEDBACKS */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-white/5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <MessageSquare className="size-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Derniers retours du formateur
                </h2>
                <p className="text-xs text-slate-500">
                  Vos feedbacks les plus récents
                </p>
              </div>
            </div>

            {recentDeliverables.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Aucun retour pour le moment. Vos évaluations apparaîtront ici.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {recentDeliverables.map((deliv) => (
                  <div
                    key={deliv.id}
                    className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {deliv.project_title}{' '}
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          v{deliv.version}
                        </span>
                      </p>
                      {deliv.feedback ? (
                        <p className="line-clamp-2 text-sm text-slate-500">
                          {deliv.feedback}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Pas de commentaire détaillé.
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        {deliv.reviewed_by_name
                          ? `Évalué par ${deliv.reviewed_by_name}`
                          : 'En attente de correction'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {deliv.score !== null && deliv.score !== undefined && (
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {deliv.score}/20
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          deliv.status === 'validated'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                            : deliv.status === 'rejected'
                              ? 'border-red-500/20 bg-red-500/10 text-red-600'
                              : 'border-amber-500/20 bg-amber-500/10 text-amber-600'
                        }
                      >
                        {deliv.status === 'validated'
                          ? 'Validé'
                          : deliv.status === 'rejected'
                            ? 'À réviser'
                            : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 5. BANDEAU ÉLIGIBILITÉ CERTIFICAT */}
          <Card className="relative flex flex-col gap-4 border-[#FF6B0B]/20 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-[#1f1f38]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FF6B0B]/5 to-transparent" />
            <div className="relative flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF6B0B]/10 text-[#FF6B0B]">
                <Award className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {pct >= 80
                    ? 'Félicitations, vous êtes éligible au certificat !'
                    : 'Débloquez votre certificat'}
                </h3>
                <p className="text-sm text-slate-500">
                  {pct >= 80
                    ? 'Votre certificat est disponible dans la section Mes Certificats.'
                    : `${data.validated_projects}/${data.total_projects} projets validés — un certificat est débloqué à 80% (soit encore ${Math.max(0, Math.ceil(0.8 * data.total_projects) - data.validated_projects)} projet(s) à valider).`}
                </p>
              </div>
            </div>
            {pct >= 80 ? (
              <Link to="/certificats" className="shrink-0">
                <Button className="bg-[#FF6B0B] text-white hover:bg-[#e85f08]">
                  Voir mes certificats
                  <ExternalLink className="ml-2 size-4" />
                </Button>
              </Link>
            ) : null}
          </Card>
        </>
      )}
    </div>
  )
}

export default LearnerDashboard