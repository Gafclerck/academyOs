import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Calendar,
  BookOpen,
  Pencil,
  RefreshCw,
  FolderKanban,
  UserRound,
  AlertCircle,
  UserPlus,
  GraduationCap,
  Mail,
  CheckCircle2,
  UserCheck,
  X,
  ChevronDown,
  Loader2,
  UserMinus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/context/AuthContext'

import programmeService from '@/services/programmes/programmeService'

import {
  getEnrollments,
  getTrainerAssignments,
  assignMentor,
} from '@/services/membreService'

import { CohortStatsTab } from '@/components/cohortes/CohortStatsTab'
import { CohortDeliverablesTab } from '@/components/cohortes/CohortDeliverablesTab'

import type {
  BackendEnrollment,
  BackendTrainerAssignment,
} from '@/types/programme'

/* ============================================================
   FORMAT DATE
============================================================ */

const formatDate = (
  date?: string | null,
): string => {
  if (!date) {
    return '—'
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString(
    'fr-FR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  )
}

/* ============================================================
   PAGE
============================================================ */

const CohorteDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { id } = useParams<{
    id: string
  }>()

  /* ============================================================
     RÔLE UTILISATEUR
     Le formateur a un accès en lecture seule : aucune action de
     gestion (édition, ajout d'apprenant, attribution de mentor).
  ============================================================ */

  const isTrainer = user?.role === 'trainer'
  const canManage = !isTrainer

  /* ============================================================
     ÉTATS COHORTE
  ============================================================ */

  const [cohorte, setCohorte] =
    React.useState<any | null>(null)

  const [programmes, setProgrammes] =
    React.useState<any[]>([])

  const [rentrees, setRentrees] =
    React.useState<any[]>([])

  const [activeTab, setActiveTab] =
    React.useState<'stats' | 'members' | 'deliverables'>('stats')

  /* ============================================================
     ÉTATS MEMBRES
  ============================================================ */

  const [enrollments, setEnrollments] =
    React.useState<BackendEnrollment[]>([])

  const [trainerAssignments, setTrainerAssignments] =
    React.useState<BackendTrainerAssignment[]>([])

  /* ============================================================
     ÉTATS CHARGEMENT
  ============================================================ */

  const [isLoading, setIsLoading] =
    React.useState(true)

  const [isFetching, setIsFetching] =
    React.useState(false)

  /* ============================================================
     ERREURS
  ============================================================ */

  const [error, setError] =
    React.useState<string | null>(null)

  const [membersError, setMembersError] =
    React.useState<string | null>(null)

  /* ============================================================
     MODAL MENTOR
  ============================================================ */

  const [isMentorModalOpen, setIsMentorModalOpen] =
    React.useState(false)

  const [selectedEnrollment, setSelectedEnrollment] =
    React.useState<BackendEnrollment | null>(null)

  const [selectedMentorId, setSelectedMentorId] =
    React.useState<string>('')

  const [isMentorSubmitting, setIsMentorSubmitting] =
    React.useState(false)

  const [mentorError, setMentorError] =
    React.useState<string | null>(null)

  /* ============================================================
     CHARGER LA COHORTE + MEMBRES
  ============================================================ */

  const loadCohorte = React.useCallback(
    async (refresh = false) => {
      if (!id) {
        return
      }

      try {
        if (refresh) {
          setIsFetching(true)
        } else {
          setIsLoading(true)
        }

        setError(null)
        setMembersError(null)

        const [
          cohorteData,
          programmesData,
          rentreesData,
          enrollmentsData,
          trainerAssignmentsData,
        ] = await Promise.all([
          programmeService.getCohorteById(id),
          programmeService.getProgrammes(),
          programmeService.getAllRentrees(),
          getEnrollments(id),
          getTrainerAssignments(id),
        ])

        if (!cohorteData) {
          setCohorte(null)
          return
        }

        setCohorte(cohorteData)

        setProgrammes(
          programmesData,
        )

        setRentrees(
          rentreesData,
        )

        setEnrollments(
          enrollmentsData,
        )

        setTrainerAssignments(
          trainerAssignmentsData,
        )
      } catch (err) {
        console.error(
          '[CohorteDetailPage] Erreur:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue lors de la récupération de la cohorte.',
        )
      } finally {
        setIsLoading(false)
        setIsFetching(false)
      }
    },
    [id],
  )

  /* ============================================================
     CHARGEMENT INITIAL
  ============================================================ */

  React.useEffect(() => {
    loadCohorte()
  }, [loadCohorte])

  /* ============================================================
     OUVRIR LE MODAL MENTOR
  ============================================================ */

  const openMentorModal = (
    enrollment: BackendEnrollment,
  ) => {
    setSelectedEnrollment(enrollment)

    setSelectedMentorId(
      enrollment.mentor?.id
        ? String(enrollment.mentor.id)
        : '',
    )

    setMentorError(null)

    setIsMentorModalOpen(true)
  }

  /* ============================================================
     FERMER LE MODAL
  ============================================================ */

  const closeMentorModal = () => {
    if (isMentorSubmitting) {
      return
    }

    setIsMentorModalOpen(false)

    setSelectedEnrollment(null)

    setSelectedMentorId('')

    setMentorError(null)
  }

  /* ============================================================
     ATTRIBUER / MODIFIER / RETIRER LE MENTOR
  ============================================================ */

  const handleMentorSubmit = async () => {
    if (!id) {
      return
    }

    if (!selectedEnrollment) {
      return
    }

    setIsMentorSubmitting(true)
    setMentorError(null)

    try {
      await assignMentor(
        id,
        selectedEnrollment.id,
        selectedMentorId || null,
      )

      await loadCohorte(true)

      closeMentorModal()
    } catch (err) {
      console.error(
        '[CohorteDetailPage] Erreur mentor:',
        err,
      )

      setMentorError(
        err instanceof Error
          ? err.message
          : 'Impossible de modifier le mentor.',
      )
    } finally {
      setIsMentorSubmitting(false)
    }
  }

  /* ============================================================
     ID MANQUANT
  ============================================================ */

  if (!id) {
    return (
      <div className="space-y-6">

        <Button
          variant="ghost"
          onClick={() =>
            navigate('/cohortes')
          }
          className="
            gap-2
            text-slate-500
            hover:text-[#FF6B0B]
          "
        >
          <ArrowLeft className="size-4" />
          Retour aux cohortes
        </Button>

        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-8
            text-center
            dark:border-red-500/20
            dark:bg-red-500/10
          "
        >
          <AlertCircle
            className="
              mx-auto
              size-10
              text-red-500
            "
          />

          <h2
            className="
              mt-4
              text-lg
              font-bold
              text-red-700
              dark:text-red-400
            "
          >
            Identifiant manquant
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-red-600
              dark:text-red-300
            "
          >
            Impossible d'identifier la cohorte demandée.
          </p>
        </div>

      </div>
    )
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (isLoading) {
    return (
      <div className="space-y-6">

        <Button
          variant="ghost"
          onClick={() =>
            navigate('/cohortes')
          }
          className="
            gap-2
            text-slate-500
            hover:text-[#FF6B0B]
          "
        >
          <ArrowLeft className="size-4" />
          Retour aux cohortes
        </Button>

        <div
          className="
            flex
            min-h-[400px]
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-200
            bg-white
            dark:border-white/10
            dark:bg-[#151528]
          "
        >
          <div
            className="
              flex
              flex-col
              items-center
              gap-3
            "
          >
            <RefreshCw
              className="
                size-7
                animate-spin
                text-[#FF6B0B]
              "
            />

            <p
              className="
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Chargement de la cohorte...
            </p>
          </div>
        </div>

      </div>
    )
  }

  /* ============================================================
     ERREUR
  ============================================================ */

  if (error) {
    return (
      <div className="space-y-6">

        <Button
          variant="ghost"
          onClick={() =>
            navigate('/cohortes')
          }
          className="
            gap-2
            text-slate-500
            hover:text-[#FF6B0B]
          "
        >
          <ArrowLeft className="size-4" />
          Retour aux cohortes
        </Button>

        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-6
            dark:border-red-500/20
            dark:bg-red-500/10
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <AlertCircle
              className="
                mt-0.5
                size-6
                shrink-0
                text-red-500
              "
            />

            <div className="flex-1">

              <p
                className="
                  font-semibold
                  text-red-700
                  dark:text-red-400
                "
              >
                Impossible de récupérer la cohorte.
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-600
                  dark:text-red-300
                "
              >
                {error}
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  loadCohorte(true)
                }
                disabled={isFetching}
                className="mt-4"
              >
                <RefreshCw
                  className={`
                    mr-2
                    size-4
                    ${
                      isFetching
                        ? 'animate-spin'
                        : ''
                    }
                  `}
                />

                Réessayer
              </Button>

            </div>
          </div>
        </div>

      </div>
    )
  }

  /* ============================================================
     COHORTE INTROUVABLE
  ============================================================ */

  if (!cohorte) {
    return (
      <div className="space-y-6">

        <Button
          variant="ghost"
          onClick={() =>
            navigate('/cohortes')
          }
          className="
            gap-2
            text-slate-500
            hover:text-[#FF6B0B]
          "
        >
          <ArrowLeft className="size-4" />
          Retour aux cohortes
        </Button>

        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-8
            text-center
            dark:border-red-500/20
            dark:bg-red-500/10
          "
        >
          <AlertCircle
            className="
              mx-auto
              size-10
              text-red-500
            "
          />

          <h2
            className="
              mt-4
              text-lg
              font-bold
              text-red-700
              dark:text-red-400
            "
          >
            Cohorte introuvable
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-red-600
              dark:text-red-300
            "
          >
            Cette cohorte n'existe pas ou n'est plus disponible.
          </p>
        </div>

      </div>
    )
  }

  /* ============================================================
     IDENTIFIANTS
  ============================================================ */

  const programmeId =
    cohorte.programme_id ??
    cohorte.program_id ??
    cohorte.program

  const rentreeId =
    cohorte.rentree_id ??
    cohorte.intake_id ??
    cohorte.intake

  /* ============================================================
     PROGRAMME
  ============================================================ */

  const programme =
    programmes.find(
      (item) =>
        String(item.id) ===
        String(programmeId),
    )

  const programmeName =
    cohorte.programme_nom ||
    programme?.nom ||
    programme?.name ||
    'Programme non disponible'

  /* ============================================================
     RENTRÉE
  ============================================================ */

  const rentree =
    rentrees.find(
      (item) =>
        String(item.id) ===
        String(rentreeId),
    )

  const rentreeName =
    cohorte.rentree_nom ||
    rentree?.name ||
    rentree?.nom ||
    'Rentrée non disponible'

  /* ============================================================
     DONNÉES COHORTE
  ============================================================ */

  const cohortName =
    cohorte.nom ??
    cohorte.name ??
    'Sans nom'

  const cohortDescription =
    cohorte.description ??
    'Aucune description disponible.'

  const cohortStatus =
    cohorte.statut ??
    cohorte.status ??
    'active'

  const startDate =
    cohorte.date_debut ??
    cohorte.start_date

  const endDate =
    cohorte.date_fin ??
    cohorte.end_date

  /* ============================================================
     STATISTIQUES
  ============================================================ */

  const membersCount =
    enrollments.length +
    trainerAssignments.length

  const projectsCount =
    cohorte.nb_projets ??
    cohorte.projects_count ??
    0

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <div className="space-y-6">

        {/* ======================================================
            RETOUR
        ====================================================== */}

        <Button
          variant="ghost"
          onClick={() =>
            navigate('/cohortes')
          }
          className="
            gap-2
            text-slate-500
            hover:text-[#FF6B0B]
          "
        >
          <ArrowLeft className="size-4" />
          Retour aux cohortes
        </Button>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div
          className="
            flex
            flex-col
            justify-between
            gap-5
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            dark:border-white/10
            dark:bg-[#151528]
            sm:flex-row
            sm:items-center
          "
        >
          <div className="flex items-start gap-4">

            <div
              className="
                flex
                size-14
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-[#FF6B0B]/10
              "
            >
              <Users
                className="
                  size-7
                  text-[#FF6B0B]
                "
              />
            </div>

            <div>

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <h1
                  className="
                    text-2xl
                    font-extrabold
                    tracking-tight
                    text-slate-900
                    dark:text-white
                    sm:text-3xl
                  "
                >
                  {cohortName}
                </h1>

                <StatusBadge
                  status={cohortStatus}
                />
              </div>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {cohortDescription}
              </p>

            </div>
          </div>

          {/* ACTIONS COHORTE — masquées pour le formateur (lecture seule) */}

          {canManage && (
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/cohortes/${cohorte.id}/inviter-apprenant`,
                  )
                }
                className="
                  rounded-xl
                  border-[#FF6B0B]
                  font-semibold
                  text-[#FF6B0B]
                  hover:bg-[#FF6B0B]/10
                "
              >
                <UserPlus className="mr-2 size-4" />
                Ajouter un apprenant
              </Button>

              <Button
                onClick={() =>
                  navigate(
                    `/cohortes/${cohorte.id}/edit`,
                  )
                }
                className="
                  rounded-xl
                  bg-[#FF6B0B]
                  font-semibold
                  text-white
                  hover:bg-[#e85f08]
                "
              >
                <Pencil className="mr-2 size-4" />
                Modifier
              </Button>
            </div>
          )}
        </div>

        {/* ======================================================
            PROGRAMME / RENTRÉE
        ====================================================== */}

        <div
          className="
            grid
            gap-4
            md:grid-cols-2
          "
        >

          {/* PROGRAMME */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              dark:border-white/10
              dark:bg-[#151528]
            "
          >
            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  dark:bg-blue-500/10
                "
              >
                <BookOpen
                  className="
                    size-5
                    text-blue-600
                    dark:text-blue-400
                  "
                />
              </div>

              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Programme
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {programmeName}
                </p>

              </div>

            </div>
          </div>

          {/* RENTRÉE */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              dark:border-white/10
              dark:bg-[#151528]
            "
          >
            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-purple-50
                  dark:bg-purple-500/10
                "
              >
                <Calendar
                  className="
                    size-5
                    text-purple-600
                    dark:text-purple-400
                  "
                />
              </div>

              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Rentrée
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {rentreeName}
                </p>

              </div>

            </div>
          </div>

        </div>

        {/* ======================================================
            DATES
        ====================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
          "
        >
          <StatCard
            title="Date de début"
            value={formatDate(startDate)}
            subtitle="Début de la cohorte"
            icon={Calendar}
          />

          <StatCard
            title="Date de fin"
            value={formatDate(endDate)}
            subtitle="Fin prévue de la cohorte"
            icon={Calendar}
          />
        </div>

        {/* ======================================================
            STATISTIQUES
        ====================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
          "
        >
          <StatCard
            title="Membres"
            value={membersCount}
            subtitle="Apprenants et formateurs"
            icon={UserRound}
          />

          <StatCard
            title="Projets"
            value={projectsCount}
            subtitle="Projets associés"
            icon={FolderKanban}
          />
        </div>

        {/* ======================================================
            ONGLETS
        ====================================================== */}

        <div
          className="
            flex
            flex-wrap
            gap-2
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-2
            shadow-sm
            dark:border-white/10
            dark:bg-[#151528]
          "
        >
          {(
            [
              {
                id: 'stats',
                label: 'Synthèse & Progression',
              },
              {
                id: 'members',
                label: 'Apprenants',
              },
              {
                id: 'deliverables',
                label: 'Livrables',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-semibold
                transition-all
                ${
                  activeTab === tab.id
                    ? 'bg-[#FF6B0B] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================
            CONTENU SELON ONGLET
        ====================================================== */}

        {activeTab === 'stats' && (
          <CohortStatsTab
            cohortId={cohorte.id ?? id ?? ''}
          />
        )}

        {activeTab === 'deliverables' && (
          <CohortDeliverablesTab
            cohortId={cohorte.id ?? id ?? ''}
            cohortName={cohortName}
          />
        )}

        {activeTab === 'members' && (
          <>
        {/* ======================================================
            ERREUR MEMBRES
        ====================================================== */}

        {membersError && (
          <div
            className="
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-4
              dark:border-red-500/20
              dark:bg-red-500/10
            "
          >
            <AlertCircle
              className="
                mt-0.5
                size-5
                shrink-0
                text-red-500
              "
            />

            <div>

              <p
                className="
                  font-semibold
                  text-red-700
                  dark:text-red-400
                "
              >
                Impossible de charger les membres
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-600
                  dark:text-red-300
                "
              >
                {membersError}
              </p>

            </div>
          </div>
        )}

        {/* ======================================================
            TABLEAU APPRENANTS
        ====================================================== */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-[#151528]
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              gap-3
              border-b
              border-slate-200
              p-5
              sm:flex-row
              sm:items-center
              sm:justify-between
              dark:border-white/10
            "
          >
            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#FF6B0B]/10
                "
              >
                <Users
                  className="
                    size-5
                    text-[#FF6B0B]
                  "
                />
              </div>

              <div>

                <h2
                  className="
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Apprenants
                </h2>

                <p
                  className="
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {enrollments.length} apprenant(s)
                  inscrit(s)
                </p>

              </div>

            </div>

            {/* Ajout masqué pour le formateur (lecture seule) */}

            {canManage && (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/cohortes/${cohorte.id}/inviter-apprenant`,
                  )
                }
                className="
                  gap-2
                  border-[#FF6B0B]
                  text-[#FF6B0B]
                  hover:bg-[#FF6B0B]/10
                "
              >
                <UserPlus className="size-4" />
                Ajouter
              </Button>
            )}
          </div>

          {/* TABLE */}

          {enrollments.length === 0 ? (
            <div className="p-10 text-center">

              <Users
                className="
                  mx-auto
                  size-10
                  text-slate-300
                  dark:text-slate-600
                "
              />

              <p
                className="
                  mt-3
                  font-semibold
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Aucun apprenant inscrit
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Ajoutez des apprenants à cette
                cohorte pour les voir apparaître ici.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-200
                      bg-slate-50/70
                      dark:border-white/10
                      dark:bg-white/[0.03]
                    "
                  >
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Apprenant
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Email
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Mentor
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Inscription
                    </th>

                    {canManage && (
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-200
                    dark:divide-white/10
                  "
                >
                  {enrollments.map(
                    (enrollment) => {
                      const user =
                        enrollment.user

                      const fullName =
                        user.full_name ||
                        `${user.first_name ?? ''} ${
                          user.last_name ?? ''
                        }`.trim() ||
                        'Utilisateur'

                      const mentor =
                        enrollment.mentor

                      const mentorName =
                        mentor?.user?.full_name ||
                        `${mentor?.user?.first_name ?? ''} ${
                          mentor?.user?.last_name ?? ''
                        }`.trim()

                      return (
                        <tr
                          key={enrollment.id}
                          className="
                            transition
                            hover:bg-slate-50
                            dark:hover:bg-white/[0.03]
                          "
                        >

                          {/* APPRENANT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div
                                className="
                                  flex
                                  size-10
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-[#FF6B0B]/10
                                  font-bold
                                  text-[#FF6B0B]
                                "
                              >
                                {(
                                  user.first_name ||
                                  fullName
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p
                                  className="
                                    font-semibold
                                    text-slate-900
                                    dark:text-white
                                  "
                                >
                                  {fullName}
                                </p>

                                <p
                                  className="
                                    text-xs
                                    text-slate-500
                                    dark:text-slate-400
                                  "
                                >
                                  Apprenant
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4">

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                                text-sm
                                text-slate-600
                                dark:text-slate-300
                              "
                            >
                              <Mail className="size-4 text-slate-400" />

                              {user.email}

                            </div>

                          </td>

                          {/* MENTOR */}

                          <td className="px-5 py-4">

                            {mentor && mentorName ? (
                              <div className="flex items-center gap-2">

                                <div
                                  className="
                                    flex
                                    size-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-purple-50
                                    text-xs
                                    font-bold
                                    text-purple-600
                                    dark:bg-purple-500/10
                                    dark:text-purple-400
                                  "
                                >
                                  {(
                                    mentor.user.first_name ||
                                    mentorName
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>

                                  <p
                                    className="
                                      text-sm
                                      font-semibold
                                      text-slate-800
                                      dark:text-white
                                    "
                                  >
                                    {mentorName}
                                  </p>

                                  <p
                                    className="
                                      text-xs
                                      text-purple-600
                                      dark:text-purple-400
                                    "
                                  >
                                    Mentor
                                  </p>

                                </div>

                              </div>
                            ) : (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  bg-slate-100
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-medium
                                  text-slate-500
                                  dark:bg-white/10
                                  dark:text-slate-400
                                "
                              >
                                Aucun mentor
                              </span>
                            )}

                          </td>

                          {/* STATUT */}

                          <td className="px-5 py-4">

                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                bg-emerald-50
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                text-emerald-600
                                dark:bg-emerald-500/10
                                dark:text-emerald-400
                              "
                            >
                              <CheckCircle2 className="size-3.5" />

                              {enrollment.status ===
                              'active'
                                ? 'Actif'
                                : enrollment.status}
                            </span>

                          </td>

                          {/* INSCRIPTION */}

                          <td
                            className="
                              px-5
                              py-4
                              text-sm
                              text-slate-600
                              dark:text-slate-300
                            "
                          >
                            {formatDate(
                              enrollment.enrolled_at,
                            )}
                          </td>

                          {/* ACTION MENTOR — masquée pour le formateur */}

                          {canManage && (
                            <td className="px-5 py-4">

                              <div className="flex justify-end">

                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    openMentorModal(
                                      enrollment,
                                    )
                                  }
                                  className="
                                    gap-2
                                    rounded-xl
                                    border-purple-200
                                    text-purple-600
                                    hover:bg-purple-50
                                    hover:text-purple-700
                                    dark:border-purple-500/30
                                    dark:text-purple-400
                                    dark:hover:bg-purple-500/10
                                  "
                                >
                                  <UserCheck className="size-4" />

                                  {mentor
                                    ? 'Modifier'
                                    : 'Attribuer mentor'}
                                </Button>

                              </div>

                            </td>
                          )}

                        </tr>
                      )
                    },
                  )}
                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* ======================================================
            TABLEAU FORMATEURS
            LECTURE SEULE — AUCUNE ACTION
        ====================================================== */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-[#151528]
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              items-center
              gap-3
              border-b
              border-slate-200
              p-5
              dark:border-white/10
            "
          >

            <div
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                dark:bg-blue-500/10
              "
            >
              <GraduationCap
                className="
                  size-5
                  text-blue-600
                  dark:text-blue-400
                "
              />
            </div>

            <div>

              <h2
                className="
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Formateurs
              </h2>

              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {trainerAssignments.length} formateur(s)
                affecté(s)
              </p>

            </div>

          </div>

          {/* TABLE FORMATEURS */}

          {trainerAssignments.length === 0 ? (
            <div className="p-10 text-center">

              <GraduationCap
                className="
                  mx-auto
                  size-10
                  text-slate-300
                  dark:text-slate-600
                "
              />

              <p
                className="
                  mt-3
                  font-semibold
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Aucun formateur affecté
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Aucun formateur n'est actuellement
                affecté à cette cohorte.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-200
                      bg-slate-50/70
                      dark:border-white/10
                      dark:bg-white/[0.03]
                    "
                  >

                    <th
                      className="
                        px-5
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Formateur
                    </th>

                    <th
                      className="
                        px-5
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Email
                    </th>

                    <th
                      className="
                        px-5
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Statut
                    </th>

                    <th
                      className="
                        px-5
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Affectation
                    </th>

                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-200
                    dark:divide-white/10
                  "
                >

                  {trainerAssignments.map(
                    (assignment) => {
                      const user =
                        assignment.user

                      const fullName =
                        user.full_name ||
                        `${user.first_name ?? ''} ${
                          user.last_name ?? ''
                        }`.trim() ||
                        'Utilisateur'

                      return (
                        <tr
                          key={assignment.id}
                          className="
                            transition
                            hover:bg-slate-50
                            dark:hover:bg-white/[0.03]
                          "
                        >

                          {/* FORMATEUR */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div
                                className="
                                  flex
                                  size-10
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-blue-50
                                  font-bold
                                  text-blue-600
                                  dark:bg-blue-500/10
                                  dark:text-blue-400
                                "
                              >
                                {(
                                  user.first_name ||
                                  fullName
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p
                                  className="
                                    font-semibold
                                    text-slate-900
                                    dark:text-white
                                  "
                                >
                                  {fullName}
                                </p>

                                <p
                                  className="
                                    text-xs
                                    text-slate-500
                                    dark:text-slate-400
                                  "
                                >
                                  Formateur
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4">

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                                text-sm
                                text-slate-600
                                dark:text-slate-300
                              "
                            >
                              <Mail className="size-4 text-slate-400" />

                              {user.email}

                            </div>

                          </td>

                          {/* STATUT */}

                          <td className="px-5 py-4">

                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                bg-emerald-50
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                text-emerald-600
                                dark:bg-emerald-500/10
                                dark:text-emerald-400
                              "
                            >
                              <CheckCircle2 className="size-3.5" />

                              {assignment.status ===
                              'active'
                                ? 'Actif'
                                : assignment.status}
                            </span>

                          </td>

                          {/* DATE AFFECTATION */}

                          <td
                            className="
                              px-5
                              py-4
                              text-sm
                              text-slate-600
                              dark:text-slate-300
                            "
                          >
                            {formatDate(
                              assignment.assigned_at,
                            )}
                          </td>

                        </tr>
                      )
                    },
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
        </>)}
      </div>

      {/* ========================================================
          MODAL MENTOR — inutile pour le formateur (canManage requis)
      ======================================================== */}

      {canManage &&
        isMentorModalOpen &&
        selectedEnrollment && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-slate-950/60
              p-4
              backdrop-blur-sm
            "
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closeMentorModal()
              }
            }}
          >

            <div
              className="
                w-full
                max-w-lg
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-2xl
                dark:border-white/10
                dark:bg-[#151528]
              "
            >

              {/* HEADER */}

              <div
                className="
                  flex
                  items-start
                  justify-between
                  border-b
                  border-slate-200
                  p-6
                  dark:border-white/10
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      flex
                      size-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-purple-50
                      dark:bg-purple-500/10
                    "
                  >
                    <UserCheck
                      className="
                        size-5
                        text-purple-600
                        dark:text-purple-400
                      "
                    />
                  </div>

                  <div>

                    <h2
                      className="
                        text-lg
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {selectedEnrollment.mentor
                        ? 'Modifier le mentor'
                        : 'Attribuer un mentor'}
                    </h2>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Choisissez le formateur qui accompagnera
                      cet apprenant.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={closeMentorModal}
                  disabled={isMentorSubmitting}
                  className="
                    rounded-lg
                    p-2
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                    disabled:cursor-not-allowed
                    dark:hover:bg-white/10
                    dark:hover:text-white
                  "
                >
                  <X className="size-5" />
                </button>

              </div>

              {/* APPRENANT */}

              <div className="px-6 pt-6">

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                    dark:border-white/10
                    dark:bg-white/[0.03]
                  "
                >

                  <div
                    className="
                      flex
                      size-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#FF6B0B]/10
                      font-bold
                      text-[#FF6B0B]
                    "
                  >
                    {(
                      selectedEnrollment.user.first_name ||
                      selectedEnrollment.user.full_name ||
                      'U'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <p
                      className="
                        text-sm
                        font-bold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {selectedEnrollment.user.full_name ||
                        `${selectedEnrollment.user.first_name ?? ''} ${
                          selectedEnrollment.user.last_name ?? ''
                        }`.trim()}
                    </p>

                    <p
                      className="
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {selectedEnrollment.user.email}
                    </p>

                  </div>

                </div>

              </div>

              {/* CONTENU */}

              <div className="space-y-5 p-6">

                <div>

                  <label
                    htmlFor="mentor-select"
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                      dark:text-slate-300
                    "
                  >
                    Mentor
                  </label>

                  <div className="relative">

                    <UserCheck
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-slate-400
                      "
                    />

                    <select
                      id="mentor-select"
                      value={selectedMentorId}
                      onChange={(event) =>
                        setSelectedMentorId(
                          event.target.value,
                        )
                      }
                      disabled={
                        isMentorSubmitting
                      }
                      className="
                        w-full
                        appearance-none
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        py-3
                        pl-10
                        pr-10
                        text-sm
                        font-medium
                        text-slate-900
                        outline-none
                        transition
                        focus:border-purple-500
                        focus:ring-2
                        focus:ring-purple-500/20
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        dark:border-white/10
                        dark:bg-[#10101f]
                        dark:text-white
                      "
                    >

                      <option value="">
                        Aucun mentor
                      </option>

                      {trainerAssignments.map(
                        (trainer) => {
                          const trainerName =
                            trainer.user.full_name ||
                            `${trainer.user.first_name ?? ''} ${
                              trainer.user.last_name ?? ''
                            }`.trim() ||
                            'Formateur'

                          return (
                            <option
                              key={trainer.id}
                              value={trainer.id}
                            >
                              {trainerName}
                            </option>
                          )
                        },
                      )}

                    </select>

                    <ChevronDown
                      className="
                        pointer-events-none
                        absolute
                        right-3
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-slate-400
                      "
                    />

                  </div>

                  <p
                    className="
                      mt-2
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Le mentor doit être un formateur
                    affecté à cette cohorte.
                  </p>

                </div>

                {/* ERREUR */}

                {mentorError && (
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      p-3
                      dark:border-red-500/20
                      dark:bg-red-500/10
                    "
                  >

                    <AlertCircle
                      className="
                        mt-0.5
                        size-4
                        shrink-0
                        text-red-500
                      "
                    />

                    <p
                      className="
                        text-sm
                        text-red-600
                        dark:text-red-300
                      "
                    >
                      {mentorError}
                    </p>

                  </div>
                )}

                {/* ACTIONS MODAL */}

                <div
                  className="
                    flex
                    flex-col-reverse
                    gap-2
                    sm:flex-row
                    sm:justify-end
                  "
                >

                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeMentorModal}
                    disabled={isMentorSubmitting}
                    className="
                      rounded-xl
                    "
                  >
                    Annuler
                  </Button>

                  {selectedEnrollment.mentor && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedMentorId('')
                      }}
                      disabled={isMentorSubmitting}
                      className="
                        gap-2
                        rounded-xl
                        border-red-200
                        text-red-600
                        hover:bg-red-50
                        hover:text-red-700
                        dark:border-red-500/30
                        dark:text-red-400
                        dark:hover:bg-red-500/10
                      "
                    >
                      <UserMinus className="size-4" />
                      Retirer
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleMentorSubmit}
                    disabled={isMentorSubmitting}
                    className="
                      rounded-xl
                      bg-[#FF6B0B]
                      font-semibold
                      text-white
                      hover:bg-[#e85f08]
                    "
                  >

                    {isMentorSubmitting ? (
                      <>
                        <Loader2
                          className="
                            mr-2
                            size-4
                            animate-spin
                          "
                        />

                        Enregistrement...
                      </>
                    ) : selectedMentorId ? (
                      <>
                        <UserCheck className="mr-2 size-4" />

                        {selectedEnrollment.mentor
                          ? 'Modifier le mentor'
                          : 'Attribuer le mentor'}
                      </>
                    ) : (
                      <>
                        <UserMinus className="mr-2 size-4" />

                        Retirer le mentor
                      </>
                    )}

                  </Button>

                </div>

              </div>

            </div>

          </div>
        )}

    </>
  )
}

export default CohorteDetailPage