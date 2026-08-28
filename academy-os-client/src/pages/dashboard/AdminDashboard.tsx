import React, { useEffect, useState } from 'react'

import {
  Users,
  BookOpen,
  GraduationCap,
  FolderGit2,
  UserPlus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  CalendarDays,
  ClipboardCheck,
  Award,
  Target,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

import {
  dashboardService,
  type DashboardRole,
  type DashboardData,
  type DashboardStats,
  type TrainerDashboard,
  type LearnerDashboard,
} from '@/services/dashboard/dashboardService'

// =====================================================
// TYPES
// =====================================================

interface DashboardProps {
  firstName: string
  navigate: ReturnType<typeof useNavigate>
}

type UserRole = DashboardRole

// =====================================================
// MAIN DASHBOARD
// =====================================================

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const role = user?.role as UserRole | undefined

  const firstName =
    user?.first_name ||
    (role === 'learner'
      ? 'Apprenant'
      : role === 'trainer'
        ? 'Formateur'
        : role === 'organizer'
          ? 'Organisateur'
          : 'Administrateur')

  // =====================================================
  // CHARGEMENT DASHBOARD SELON LE ROLE
  // =====================================================

  useEffect(() => {
    const loadDashboard = async () => {
      if (!role) {
        setError('Le rôle de l’utilisateur est introuvable.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log(
          `Chargement du dashboard pour le rôle : ${role}`,
        )

        const data =
          await dashboardService.getDashboard(role)

        console.log('Dashboard data:', data)

        setDashboard(data)
      } catch (err: any) {
        console.error(
          'Erreur lors du chargement du dashboard :',
          err,
        )

        const status = err?.response?.status

        if (status === 403) {
          setError(
            'Vous n’avez pas les permissions nécessaires pour accéder à ce tableau de bord.',
          )
        } else if (status === 401) {
          setError(
            'Votre session a expiré. Veuillez vous reconnecter.',
          )
        } else {
          setError(
            'Impossible de charger les statistiques du tableau de bord.',
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [role])

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-[#FF6B0B]" />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chargement du tableau de bord...
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-500/20 dark:bg-white/[0.04]">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <AlertCircle className="size-6" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Erreur de chargement
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {error ||
                'Les données du tableau de bord ne sont pas disponibles.'}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-[#FF6B0B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#FF6B0B]/90"
            >
              Réessayer
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // =====================================================
  // ADMIN / ORGANIZER
  // =====================================================

  if (role === 'admin' || role === 'organizer') {
    return (
      <GlobalDashboard
        stats={dashboard as DashboardStats}
        firstName={firstName}
        navigate={navigate}
        role={role}
      />
    )
  }

  // =====================================================
  // TRAINER
  // =====================================================

  if (role === 'trainer') {
    return (
      <TrainerDashboard
        data={dashboard as TrainerDashboard}
        firstName={firstName}
        navigate={navigate}
      />
    )
  }

  // =====================================================
  // LEARNER
  // =====================================================

  return (
    <LearnerDashboard
      data={dashboard as LearnerDashboard}
      firstName={firstName}
      navigate={navigate}
    />
  )
}

// =====================================================
// GLOBAL DASHBOARD
// ADMIN + ORGANIZER
// =====================================================

interface GlobalDashboardProps extends DashboardProps {
  stats: DashboardStats
  role: 'admin' | 'organizer'
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
  stats,
  firstName,
  navigate,
  role,
}) => {
  const isAdmin = role === 'admin'

  return (
    <DashboardLayout>
      <DashboardHeader
        label={
          isAdmin
            ? 'Administration'
            : 'Espace organisateur'
        }
        title={`Bonjour, ${firstName} 👋`}
        description={
          isAdmin
            ? "Vue globale de l'activité de votre académie."
            : 'Pilotez les programmes, cohortes et apprenants.'
        }
        buttonLabel={
          isAdmin ? 'Nouvel utilisateur' : 'Nouveau programme'
        }
        buttonIcon={isAdmin ? UserPlus : BookOpen}
        onClick={() =>
          navigate(
            isAdmin
              ? '/users/new'
              : '/programmes/new',
          )
        }
      />

      {/* =====================================================
          VUE GLOBALE
      ===================================================== */}

      <DashboardSectionTitle
        title="Vue globale"
        description="Les principales statistiques de votre académie."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Utilisateurs"
          value={stats.total_users}
          description="utilisateurs au total"
          icon={Users}
          onClick={() => navigate('/users')}
        />

        <DashboardStatCard
          title="Programmes"
          value={stats.total_programs}
          description={`${stats.active_programs} actifs`}
          icon={BookOpen}
          onClick={() => navigate('/programmes')}
        />

        <DashboardStatCard
          title="Cohortes"
          value={stats.total_cohorts}
          description={`${stats.active_cohorts} actives`}
          icon={GraduationCap}
          onClick={() => navigate('/cohortes')}
        />

        <DashboardStatCard
          title="Projets"
          value={stats.total_projects}
          description={`${stats.published_projects} publiés`}
          icon={FolderGit2}
          onClick={() => navigate('/projets')}
        />
      </div>

      {/* =====================================================
          UTILISATEURS
      ===================================================== */}

      <DashboardSectionTitle
        title="Utilisateurs"
        description="Répartition des utilisateurs de la plateforme."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Apprenants"
          value={stats.total_learners}
          description={`${stats.active_learners} actifs`}
          icon={Users}
        />

        <KpiCard
          title="Formateurs"
          value={stats.total_trainers}
          description="formateurs enregistrés"
          icon={GraduationCap}
        />

        <KpiCard
          title="Organisateurs"
          value={stats.total_organizers}
          description="organisateurs enregistrés"
          icon={Users}
        />

        <KpiCard
          title="Administrateurs"
          value={stats.total_admins}
          description="administrateurs enregistrés"
          icon={Award}
        />
      </div>

      {/* =====================================================
          SUIVI
      ===================================================== */}

      <DashboardSectionTitle
        title="Suivi"
        description="État actuel des apprenants, cohortes et évaluations."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Apprenants actifs"
          value={stats.active_learners}
          description={`${stats.pending_learners} en attente`}
          icon={Users}
        />

        <KpiCard
          title="Cohortes actives"
          value={stats.active_cohorts}
          description={`${stats.upcoming_cohorts} à venir`}
          icon={GraduationCap}
        />

        <KpiCard
          title="Évaluations"
          value={stats.total_evaluations}
          description={`${stats.total_pending_evaluations} en attente`}
          icon={ClipboardCheck}
        />

        <KpiCard
          title="Certificats"
          value={stats.issued_certificates}
          description={`${stats.pending_certificates} en attente`}
          icon={Award}
        />
      </div>

      {/* =====================================================
          PERFORMANCE
      ===================================================== */}

      <DashboardSectionTitle
        title="Performance"
        description="Indicateurs globaux de performance."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <RateCard
          title="Taux de complétion"
          value={stats.global_completion_rate}
          icon={Target}
        />

        <RateCard
          title="Taux de validation"
          value={stats.global_validation_rate}
          icon={CheckCircle2}
        />

        <RateCard
          title="Score moyen"
          value={stats.average_score}
          icon={TrendingUp}
          suffix="/100"
        />
      </div>

      {/* =====================================================
          COHORTES + EVALUATIONS
      ===================================================== */}

      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard
          title="Cohortes"
          icon={GraduationCap}
          items={[
            ['Total', stats.total_cohorts],
            ['Actives', stats.active_cohorts],
            ['À venir', stats.upcoming_cohorts],
            ['Terminées', stats.completed_cohorts],
          ]}
        />

        <InfoCard
          title="Évaluations"
          icon={ClipboardCheck}
          items={[
            ['Total', stats.total_evaluations],
            [
              'Validées',
              stats.total_validated_evaluations,
            ],
            [
              'En attente',
              stats.total_pending_evaluations,
            ],
            [
              'Rejetées',
              stats.total_rejected_evaluations,
            ],
          ]}
        />
      </div>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <QuickActions
        title={
          isAdmin
            ? 'Actions administratives'
            : 'Actions rapides'
        }
        actions={
          isAdmin
            ? [
                {
                  title: 'Créer un utilisateur',
                  description:
                    'Ajouter un apprenant ou formateur',
                  icon: UserPlus,
                  href: '/users/new',
                },
                {
                  title: 'Créer un programme',
                  description:
                    'Ajouter une nouvelle formation',
                  icon: BookOpen,
                  href: '/programmes/new',
                },
                {
                  title: 'Créer une rentrée',
                  description:
                    'Planifier une nouvelle rentrée',
                  icon: CalendarDays,
                  href: '/rentrees/new',
                },
                {
                  title: 'Créer une cohorte',
                  description:
                    'Créer un nouveau groupe',
                  icon: GraduationCap,
                  href: '/cohortes/new',
                },
              ]
            : [
                {
                  title: 'Créer un programme',
                  description:
                    'Ajouter une nouvelle formation',
                  icon: BookOpen,
                  href: '/programmes/new',
                },
                {
                  title: 'Créer une rentrée',
                  description:
                    'Planifier une nouvelle rentrée',
                  icon: CalendarDays,
                  href: '/rentrees/new',
                },
                {
                  title: 'Créer une cohorte',
                  description:
                    'Créer un nouveau groupe',
                  icon: GraduationCap,
                  href: '/cohortes/new',
                },
                {
                  title: 'Voir les projets',
                  description:
                    'Consulter les projets',
                  icon: FolderGit2,
                  href: '/projets',
                },
              ]
        }
        navigate={navigate}
      />
    </DashboardLayout>
  )
}

// =====================================================
// TRAINER DASHBOARD
// =====================================================

interface TrainerDashboardProps extends DashboardProps {
  data: TrainerDashboard
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  data,
  firstName,
  navigate,
}) => {
  return (
    <DashboardLayout>
      <DashboardHeader
        label="Espace formateur"
        title={`Bonjour, ${firstName} 👋`}
        description="Suivez vos cohortes, apprenants, projets et corrections."
      />

      {/* =====================================================
          ACTIVITÉ
      ===================================================== */}

      <DashboardSectionTitle
        title="Mon activité"
        description="Les indicateurs liés à votre activité de formateur."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Cohortes"
          value={data.total_assigned_cohorts}
          description="cohortes assignées"
          icon={GraduationCap}
          onClick={() => navigate('/cohortes')}
        />

        <DashboardStatCard
          title="Apprenants"
          value={data.total_students}
          description="apprenants suivis"
          icon={Users}
          onClick={() => navigate('/cohortes')}
        />

        <DashboardStatCard
          title="Mentorés"
          value={data.direct_mentees_count}
          description="mentorés directs"
          icon={Users}
          onClick={() => navigate('/cohortes')}
        />

        <DashboardStatCard
          title="À corriger"
          value={data.pending_reviews_count}
          description="livrables en attente"
          icon={ClipboardCheck}
          onClick={() => navigate('/evaluations')}
        />
      </div>

      {/* =====================================================
          COHORTES
      ===================================================== */}

      <DashboardSectionTitle
        title="Mes cohortes"
        description="Résumé de vos cohortes assignées."
      />

      {data.cohorts_summary.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.cohorts_summary.map((cohort) => (
            <div
              key={cohort.cohort_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {cohort.cohort_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {cohort.program_name}
                  </p>
                </div>

                <span className="rounded-full bg-[#FF6B0B]/10 px-3 py-1 text-xs font-semibold text-[#FF6B0B]">
                  {cohort.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Apprenants
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {cohort.learners_count}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Progression
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {cohort.average_progress}%
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#FF6B0B] transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        cohort.average_progress,
                        0,
                      ),
                      100,
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {formatDate(cohort.start_date)}
                </span>

                <span>
                  {formatDate(cohort.end_date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Aucune cohorte"
          description="Aucune cohorte ne vous est actuellement assignée."
        />
      )}

      {/* =====================================================
          LIVRABLES EN ATTENTE
      ===================================================== */}

      <DashboardSectionTitle
        title="Livrables à corriger"
        description="Les livrables récemment soumis par vos apprenants."
      />

      {data.pending_reviews.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {data.pending_reviews.map((review) => (
              <div
                key={review.deliverable_id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="size-4 text-[#FF6B0B]" />

                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                      {review.project_title}
                    </h3>
                  </div>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {review.learner_name} ·{' '}
                    {review.cohort_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Version {review.version} ·{' '}
                    {formatDateTime(
                      review.submitted_at,
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {review.repo_url && (
                    <a
                      href={review.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      Repository
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/evaluations')
                    }
                    className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#FF6B0B]/90"
                  >
                    <Eye className="size-3.5" />
                    Corriger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="Aucun livrable en attente"
          description="Tous les livrables ont été traités."
        />
      )}

      {/* =====================================================
          ÉVALUATIONS RÉCENTES
      ===================================================== */}

      <DashboardSectionTitle
        title="Évaluations récentes"
        description="Vos dernières corrections."
      />

      {data.recent_reviews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.recent_reviews.map((review) => (
            <div
              key={review.deliverable_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                    {review.project_title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {review.learner_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {review.cohort_name}
                  </p>
                </div>

                <span className="shrink-0 text-lg font-bold text-[#FF6B0B]">
                  {review.score}/100
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {review.status}
                </span>

                <span className="text-xs text-slate-400">
                  {formatDateTime(review.reviewed_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="Aucune évaluation récente"
          description="Vos dernières corrections apparaîtront ici."
        />
      )}
    </DashboardLayout>
  )
}

// =====================================================
// LEARNER DASHBOARD
// =====================================================

interface LearnerDashboardProps extends DashboardProps {
  data: LearnerDashboard
}

const LearnerDashboard: React.FC<LearnerDashboardProps> = ({
  data,
  firstName,
  navigate,
}) => {
  return (
    <DashboardLayout>
      <DashboardHeader
        label="Espace apprenant"
        title={`Bonjour, ${firstName} 👋`}
        description="Retrouvez ici les informations relatives à votre parcours."
      />

      {/* =====================================================
          MON PARCOURS
      ===================================================== */}

      <DashboardSectionTitle
        title="Mon parcours"
        description="Suivez votre progression dans votre formation."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Programmes"
          value={data.total_programs}
          description={`${data.active_programs} actifs`}
          icon={BookOpen}
          onClick={() => navigate('/programmes')}
        />

        <DashboardStatCard
          title="Cohortes"
          value={data.active_cohorts}
          description={`${data.upcoming_cohorts} à venir`}
          icon={GraduationCap}
          onClick={() => navigate('/cohortes')}
        />

        <DashboardStatCard
          title="Projets"
          value={data.total_projects}
          description={`${data.published_projects} publiés`}
          icon={FolderGit2}
          onClick={() => navigate('/projets')}
        />

        <DashboardStatCard
          title="Évaluations"
          value={data.total_evaluations}
          description={`${data.total_pending_evaluations} en attente`}
          icon={ClipboardCheck}
          onClick={() => navigate('/evaluations')}
        />
      </div>

      {/* =====================================================
          PROGRESSION
      ===================================================== */}

      <DashboardSectionTitle
        title="Ma progression"
        description="Vos indicateurs de progression et de performance."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <RateCard
          title="Complétion"
          value={data.global_completion_rate}
          icon={Target}
        />

        <RateCard
          title="Validation"
          value={data.global_validation_rate}
          icon={CheckCircle2}
        />

        <RateCard
          title="Score moyen"
          value={data.average_score}
          icon={TrendingUp}
          suffix="/100"
        />
      </div>

      {/* =====================================================
          EVALUATIONS
      ===================================================== */}

      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard
          title="Mes évaluations"
          icon={ClipboardCheck}
          items={[
            ['Total', data.total_evaluations],
            [
              'Validées',
              data.total_validated_evaluations,
            ],
            [
              'En attente',
              data.total_pending_evaluations,
            ],
            [
              'Rejetées',
              data.total_rejected_evaluations,
            ],
          ]}
        />

        <InfoCard
          title="Mes cohortes"
          icon={GraduationCap}
          items={[
            ['Total', data.total_cohorts],
            ['Actives', data.active_cohorts],
            ['À venir', data.upcoming_cohorts],
            ['Terminées', data.completed_cohorts],
          ]}
        />
      </div>

      {/* =====================================================
          CERTIFICATS
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
            <Award className="size-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              Mes certificats
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Suivez l’état de vos certificats.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {data.issued_certificates}
          </span>

          <span className="mb-1 text-sm text-slate-500 dark:text-slate-400">
            délivré(s)
          </span>
        </div>

        {data.pending_certificates > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            {data.pending_certificates} certificat(s) en
            attente
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}

// =====================================================
// LAYOUT
// =====================================================

const DashboardLayout: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-[#19192D] md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {children}
      </div>
    </div>
  )
}

// =====================================================
// SECTION TITLE
// =====================================================

interface DashboardSectionTitleProps {
  title: string
  description: string
}

const DashboardSectionTitle: React.FC<
  DashboardSectionTitleProps
> = ({ title, description }) => {
  return (
    <div className="pt-2">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}

// =====================================================
// HEADER
// =====================================================

interface DashboardHeaderProps {
  label: string
  title: string
  description: string
  buttonLabel?: string
  buttonIcon?: React.ComponentType<{
    className?: string
  }>
  onClick?: () => void
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  label,
  title,
  description,
  buttonLabel,
  buttonIcon: Icon,
  onClick,
}) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-[#FF6B0B]">
          {label}
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {buttonLabel && onClick && (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#FF6B0B]/90 hover:shadow-md"
        >
          {Icon && <Icon className="size-4" />}

          {buttonLabel}
        </button>
      )}
    </div>
  )
}

// =====================================================
// STAT CARD
// =====================================================

interface DashboardStatCardProps {
  title: string
  value: number
  description: string
  icon: React.ComponentType<{
    className?: string
  }>
  onClick: () => void
}

const DashboardStatCard: React.FC<
  DashboardStatCardProps
> = ({
  title,
  value,
  description,
  icon: Icon,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
          <Icon className="size-5" />
        </div>

        <ArrowRight className="size-4 text-slate-300 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 dark:text-slate-600" />
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          {formatNumber(value)}
        </p>

        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {description}
        </p>
      </div>
    </button>
  )
}

// =====================================================
// KPI CARD
// =====================================================

interface KpiCardProps {
  title: string
  value: number
  description: string
  icon: React.ComponentType<{
    className?: string
  }>
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
        <Icon className="size-5" />
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {description}
      </p>
    </div>
  )
}

// =====================================================
// RATE CARD
// =====================================================

interface RateCardProps {
  title: string
  value: number
  icon: React.ComponentType<{
    className?: string
  }>
  suffix?: string
}

const RateCard: React.FC<RateCardProps> = ({
  title,
  value,
  icon: Icon,
  suffix = '%',
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {formatDecimal(value)}
            {suffix}
          </p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

// =====================================================
// INFO CARD
// =====================================================

interface InfoCardProps {
  title: string
  icon: React.ComponentType<{
    className?: string
  }>
  items: Array<[string, number]>
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon: Icon,
  items,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
          <Icon className="size-4" />
        </div>

        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between px-5 py-3.5"
          >
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {label}
            </span>

            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatNumber(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// QUICK ACTIONS
// =====================================================

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{
    className?: string
  }>
  href: string
}

interface QuickActionsProps {
  title: string
  actions: QuickAction[]
  navigate: ReturnType<typeof useNavigate>
}

const QuickActions: React.FC<QuickActionsProps> = ({
  title,
  actions,
  navigate,
}) => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Accédez rapidement aux principales fonctionnalités.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <button
              key={action.title}
              type="button"
              onClick={() => navigate(action.href)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#FF6B0B]/30 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
                <Icon className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {action.title}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {action.description}
                </p>
              </div>

              <ArrowRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 dark:text-slate-600" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// =====================================================
// EMPTY STATE
// =====================================================

interface EmptyStateProps {
  icon: React.ComponentType<{
    className?: string
  }>
  title: string
  description: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
        <Icon className="size-6" />
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

// =====================================================
// HELPERS
// =====================================================

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0'
  }

  return new Intl.NumberFormat('fr-FR').format(value)
}

const formatDecimal = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0'
  }

  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
  }).format(value)
}

const formatDate = (value: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const formatDateTime = (value: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// =====================================================
// EXPORT
// =====================================================

export default AdminDashboard