import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Pencil,
  Users,
  AlertCircle,
  ChevronRight,
  FolderKanban,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useProgramme } from '@/hooks/useProgrammes'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'

import cohorteService from '@/services/cohortes/cohorteService'
import { getRentrees } from '@/services/rentrees/rentreeService'

/* ============================================================
   TYPES
============================================================ */

interface Cohorte {
  id: string | number

  nom?: string
  name?: string

  description?: string | null

  statut?: string
  status?: string

  programme_id?: string | number | null
  programme?: string | number | null
  program_id?: string | number | null
  program?: string | number | null

  rentree_id?: string | number | null
  rentree?: string | number | null
  intake_id?: string | number | null
  intake?: string | number | null

  rentree_nom?: string | null
  intake_name?: string | null

  date_debut?: string | null
  start_date?: string | null

  date_fin?: string | null
  end_date?: string | null

  nb_apprenants?: number
  learners_count?: number
  members_count?: number
}

interface Rentree {
  id: string | number

  nom?: string
  name?: string

  statut?: string
  status?: string

  date_debut?: string | null
  date_fin?: string | null
}

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

export const ProgrammeDetailPage: React.FC = () => {
  const navigate = useNavigate()

  const { id } = useParams<{
    id: string
  }>()

  const { user } = useAuth()

  /* ============================================================
     UTILISATEUR CONNECTÉ
  ============================================================ */

  const role = user?.role

  const isAdmin = role === 'admin'
  const isOrganizer = role === 'organizer'
  const isTrainer = role === 'trainer'
  const isLearner = role === 'learner'

  /*
   * Droits d'affichage.
   *
   * Le backend reste responsable du filtrage
   * des données accessibles à l'utilisateur.
   */

  const canEdit =
    isAdmin || isOrganizer

  const canAccessProjects =
  isAdmin ||
  isOrganizer ||
  isTrainer ||
  isLearner

  /* ============================================================
     TEXTES SELON LE RÔLE
  ============================================================ */

  const pageSubtitle = isAdmin
    ? 'Consultez et gérez les informations de ce programme.'
    : isOrganizer
      ? 'Consultez les informations et les cohortes associées à ce programme.'
      : isTrainer
        ? 'Consultez le programme et les cohortes auxquelles vous êtes associé.'
        : 'Découvrez les informations relatives à votre parcours de formation.'

  const cohortesTitle = isLearner
    ? 'Ma cohorte'
    : 'Cohortes du programme'

  const cohortesDescription = isLearner
    ? 'Votre cohorte associée à ce programme.'
    : 'Les cohortes associées à ce programme.'

  /* ============================================================
     PROGRAMME
  ============================================================ */

  const {
    data: programme,
    isLoading: isProgrammeLoading,
    isError: isProgrammeError,
    error: programmeError,
  } = useProgramme(id)

  /* ============================================================
     COHORTES
  ============================================================ */

  const [cohortes, setCohortes] =
    React.useState<Cohorte[]>([])

  const [isCohortesLoading, setIsCohortesLoading] =
    React.useState(false)

  const [cohortesError, setCohortesError] =
    React.useState<string | null>(null)

  /* ============================================================
     RENTRÉES
  ============================================================ */

  const [rentrees, setRentrees] =
    React.useState<Rentree[]>([])

  const [isRentreesLoading, setIsRentreesLoading] =
    React.useState(false)

  /* ============================================================
     CHARGER DONNÉES
  ============================================================ */

  const loadProgrammeData =
    React.useCallback(async () => {
      if (!id) {
        return
      }

      try {
        setIsCohortesLoading(true)
        setIsRentreesLoading(true)

        setCohortesError(null)

        const [
          cohortesData,
          rentreesData,
        ] = await Promise.all([
          cohorteService.getCohortes(),
          getRentrees(),
        ])

        /*
         * Le backend applique déjà les permissions.
         *
         * On filtre uniquement pour rattacher
         * les cohortes au programme affiché.
         */

        const programmeCohortes =
          (cohortesData as Cohorte[]).filter(
            (cohorte) => {
              const programmeId =
                cohorte.programme_id ??
                cohorte.program_id ??
                cohorte.programme ??
                cohorte.program

              return (
                String(programmeId) ===
                String(id)
              )
            },
          )

        setCohortes(
          programmeCohortes,
        )

        setRentrees(
          rentreesData as Rentree[],
        )
      } catch (error) {
        console.error(
          '[ProgrammeDetailPage] Erreur:',
          error,
        )

        const message =
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la récupération des données.'

        setCohortesError(message)
      } finally {
        setIsCohortesLoading(false)
        setIsRentreesLoading(false)
      }
    }, [id])

  /* ============================================================
     CHARGEMENT
  ============================================================ */

  React.useEffect(() => {
    loadProgrammeData()
  }, [loadProgrammeData])

  /* ============================================================
     LOADING
  ============================================================ */

  if (isProgrammeLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">

          <Loader2 className="size-5 animate-spin" />

          <span>
            Chargement du programme...
          </span>

        </div>
      </div>
    )
  }

  /* ============================================================
     ERREUR
  ============================================================ */

  if (
    isProgrammeError ||
    !programme
  ) {
    return (
      <div className="space-y-6">

        <Button
          variant="ghost"
          onClick={() =>
            navigate('/programmes')
          }
          className="gap-2"
        >
          <ArrowLeft className="size-4" />

          Retour aux programmes
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

          <div className="flex items-start gap-3">

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
                Impossible de charger le programme
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-600
                  dark:text-red-300
                "
              >
                {programmeError instanceof Error
                  ? programmeError.message
                  : 'Programme introuvable ou une erreur est survenue.'}
              </p>

            </div>

          </div>

        </div>

      </div>
    )
  }

  /* ============================================================
     RENTRÉE
  ============================================================ */

  const getRentreeForCohorte = (
    cohorte: Cohorte,
  ): Rentree | undefined => {
    const rentreeId =
      cohorte.rentree_id ??
      cohorte.intake_id ??
      cohorte.rentree ??
      cohorte.intake

    if (!rentreeId) {
      return undefined
    }

    return rentrees.find(
      (rentree) =>
        String(rentree.id) ===
        String(rentreeId),
    )
  }

  /* ============================================================
     STATISTIQUES
  ============================================================ */

  const cohortesCount =
    cohortes.length

  const learnersCount =
    cohortes.reduce(
      (total, cohorte) =>
        total +
        Number(
          cohorte.nb_apprenants ??
          cohorte.learners_count ??
          cohorte.members_count ??
          0,
        ),
      0,
    )

  const activeCohortes =
    cohortes.filter(
      (cohorte) =>
        cohorte.statut === 'active' ||
        cohorte.status === 'active' ||
        cohorte.statut === 'ongoing' ||
        cohorte.status === 'ongoing',
    ).length

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-6">

      {/* ======================================================
          RETOUR
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate('/programmes')
        }
        className="
          group
          flex
          items-center
          gap-2
          text-sm
          font-medium
          text-slate-500
          transition
          hover:text-[#FF6B0B]
          dark:text-slate-400
        "
      >
        <ArrowLeft
          className="
            size-4
            transition-transform
            group-hover:-translate-x-1
          "
        />

        Retour aux programmes
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
          dark:border-white/10
          dark:bg-[#151528]
          sm:p-8
        "
      >

        {/* DECORATION */}

        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            size-64
            rounded-full
            bg-[#FF6B0B]/5
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-20
            -left-20
            size-48
            rounded-full
            bg-orange-400/5
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          {/* PROGRAMME */}

          <div className="flex items-start gap-4">

            <div
              className="
                flex
                size-16
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-[#FF6B0B]
                to-[#ff8a3d]
                shadow-lg
                shadow-[#FF6B0B]/20
              "
            >

              <BookOpen
                className="
                  size-7
                  text-white
                "
              />

            </div>

            <div className="min-w-0">

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
                  {programme.nom ||
                    'Programme sans nom'}
                </h1>

                <StatusBadge
                  status={programme.statut}
                />

              </div>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {pageSubtitle}
              </p>

            </div>

          </div>

          {/* ACTIONS */}

          {(canEdit || canAccessProjects) && (
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >

              {canAccessProjects && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/programmes/${programme.id}/projets`,
                    )
                  }
                  className="
                    gap-2
                    rounded-xl
                    border-slate-200
                    bg-white
                    font-semibold
                    dark:border-white/10
                    dark:bg-white/[0.03]
                  "
                >

                  <FolderKanban className="size-4" />

                  Projets

                </Button>
              )}

              {canEdit && (
                <Button
                  onClick={() =>
                    navigate(
                      `/programmes/${programme.id}/edit`,
                    )
                  }
                  className="
                    rounded-xl
                    bg-[#FF6B0B]
                    px-5
                    font-semibold
                    text-white
                    shadow-lg
                    shadow-[#FF6B0B]/20
                    hover:bg-[#e85f08]
                  "
                >

                  <Pencil className="mr-2 size-4" />

                  Modifier

                </Button>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ======================================================
          APPRENANT
          PRÉSENTATION SIMPLIFIÉE
      ====================================================== */}

      {isLearner ? (

        <div className="space-y-6">

          {/* PROGRAMME */}

          <div
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
              dark:border-white/10
              dark:bg-[#151528]
              sm:p-8
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
                  bg-[#FF6B0B]/10
                "
              >

                <BookOpen
                  className="
                    size-5
                    text-[#FF6B0B]
                  "
                />

              </div>

              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-[#FF6B0B]
                  "
                >
                  Mon parcours
                </p>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {programme.nom}
                </h2>

              </div>

            </div>

            <div className="mt-6">

              <p
                className="
                  text-sm
                  leading-7
                  text-slate-600
                  dark:text-slate-300
                "
              >
                {programme.description ||
                  'Aucune description disponible pour ce programme.'}
              </p>

            </div>

            <div
              className="
                mt-6
                flex
                items-center
                gap-3
                rounded-2xl
                bg-slate-50
                p-4
                dark:bg-white/[0.04]
              "
            >

              <div
                className="
                  flex
                  size-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-500/10
                "
              >

                <Calendar
                  className="
                    size-5
                    text-emerald-500
                  "
                />

              </div>

              <div>

                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  Statut du programme
                </p>

                <div className="mt-1">
                  <StatusBadge
                    status={programme.statut}
                  />
                </div>

              </div>

            </div>

          </div>

        </div>

      ) : (

        /* ====================================================
           ADMIN / ORGANIZER / TRAINER
        ==================================================== */

        <div
          className="
            grid
            gap-6
            lg:grid-cols-3
          "
        >

          {/* DESCRIPTION */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
              dark:border-white/10
              dark:bg-[#151528]
              lg:col-span-2
            "
          >

            <div
              className="
                mb-5
                flex
                items-center
                gap-3
              "
            >

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

                <BookOpen
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
                  Informations du programme
                </h2>

                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  Informations générales
                </p>

              </div>

            </div>

            <div className="space-y-6">

              <div>

                <p
                  className="
                    mb-1
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Nom
                </p>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {programme.nom || '—'}
                </p>

              </div>

              <div>

                <p
                  className="
                    mb-1
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Description
                </p>

                <p
                  className="
                    text-sm
                    leading-7
                    text-slate-600
                    dark:text-slate-300
                  "
                >
                  {programme.description ||
                    'Aucune description disponible.'}
                </p>

              </div>

              <div>

                <p
                  className="
                    mb-1
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Statut
                </p>

                <StatusBadge
                  status={programme.statut}
                />

              </div>

            </div>

          </div>

          {/* RÉSUMÉ */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
              dark:border-white/10
              dark:bg-[#151528]
            "
          >

            <h2
              className="
                mb-5
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Résumé
            </h2>

            <div className="space-y-5">

              {/* COHORTES */}

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    size-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-500/10
                  "
                >

                  <Users
                    className="
                      size-5
                      text-blue-500
                    "
                  />

                </div>

                <div>

                  <p className="text-xs text-slate-400">
                    Cohortes
                  </p>

                  <p
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {cohortesCount}
                  </p>

                </div>

              </div>

              {/* COHORTES ACTIVES */}

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    size-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-500/10
                  "
                >

                  <Calendar
                    className="
                      size-5
                      text-emerald-500
                    "
                  />

                </div>

                <div>

                  <p className="text-xs text-slate-400">
                    Cohortes actives
                  </p>

                  <p
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {activeCohortes}
                  </p>

                </div>

              </div>

              {/* APPRENANTS */}

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    size-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-purple-500/10
                  "
                >

                  <Users
                    className="
                      size-5
                      text-purple-500
                    "
                  />

                </div>

                <div>

                  <p className="text-xs text-slate-400">
                    Apprenants
                  </p>

                  <p
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {learnersCount}
                  </p>

                </div>

              </div>

              {/* CRÉATION */}

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    size-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-orange-500/10
                  "
                >

                  <Clock
                    className="
                      size-5
                      text-orange-500
                    "
                  />

                </div>

                <div>

                  <p className="text-xs text-slate-400">
                    Créé le
                  </p>

                  <p
                    className="
                      text-sm
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {formatDate(
                      programme.created_at,
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          COHORTES
      ====================================================== */}

      <div
        className="
          overflow-hidden
          rounded-3xl
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
            gap-4
            border-b
            border-slate-200
            p-6
            dark:border-white/10
            sm:flex-row
            sm:items-center
            sm:justify-between
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
                {cohortesTitle}
              </h2>

              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {cohortesDescription}
              </p>

            </div>

          </div>

          <div
            className="
              rounded-full
              bg-slate-100
              px-3
              py-1
              text-xs
              font-semibold
              text-slate-600
              dark:bg-white/[0.06]
              dark:text-slate-300
            "
          >
            {cohortesCount}{' '}
            {cohortesCount > 1
              ? 'cohortes'
              : 'cohorte'}
          </div>

        </div>

        {/* ERROR */}

        {cohortesError && (
          <div
            className="
              flex
              items-start
              gap-3
              border-b
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
                Impossible de charger les cohortes
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-600
                  dark:text-red-300
                "
              >
                {cohortesError}
              </p>

            </div>

          </div>
        )}

        {/* LOADING */}

        {isCohortesLoading ? (

          <div
            className="
              flex
              min-h-[240px]
              items-center
              justify-center
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                text-slate-500
                dark:text-slate-400
              "
            >

              <Loader2
                className="
                  size-5
                  animate-spin
                "
              />

              <span>
                Chargement des cohortes...
              </span>

            </div>

          </div>

        ) : cohortes.length === 0 ? (

          /* EMPTY */

          <div className="p-12 text-center">

            <div
              className="
                mx-auto
                flex
                size-14
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                dark:bg-white/[0.05]
              "
            >

              <Users
                className="
                  size-6
                  text-slate-400
                  dark:text-slate-500
                "
              />

            </div>

            <p
              className="
                mt-4
                font-semibold
                text-slate-700
                dark:text-slate-300
              "
            >
              {isLearner
                ? 'Aucune cohorte associée'
                : 'Aucune cohorte'}
            </p>

            <p
              className="
                mx-auto
                mt-1
                max-w-md
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              {isLearner
                ? 'Vous n’êtes actuellement associé à aucune cohorte pour ce programme.'
                : "Aucune cohorte n'est encore associée à ce programme."}
            </p>

          </div>

        ) : (

          /* ====================================================
             TABLE
          ==================================================== */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

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
                      px-6
                      py-4
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Cohorte
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Rentrée
                  </th>

                  <th
                    className="
                      px-6
                      py-4
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Période
                  </th>

                  <th
                    className="
                      px-6
                      py-4
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

                  {!isLearner && (
                    <th
                      className="
                        px-6
                        py-4
                        text-right
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
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

                {cohortes.map(
                  (cohorte) => {

                    const rentree =
                      getRentreeForCohorte(
                        cohorte,
                      )

                    const rentreeName =
                      cohorte.rentree_nom ||
                      cohorte.intake_name ||
                      rentree?.nom ||
                      rentree?.name ||
                      'Rentrée non disponible'

                    const cohortName =
                      cohorte.nom ||
                      cohorte.name ||
                      'Cohorte sans nom'

                    const cohortStatus =
                      cohorte.statut ||
                      cohorte.status ||
                      'active'

                    const startDate =
                      cohorte.date_debut ||
                      cohorte.start_date

                    const endDate =
                      cohorte.date_fin ||
                      cohorte.end_date

                    return (
                      <tr
                        key={cohorte.id}
                        className="
                          group
                          transition
                          hover:bg-slate-50/80
                          dark:hover:bg-white/[0.03]
                        "
                      >

                        {/* COHORTE */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                flex
                                size-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-[#FF6B0B]/10
                                transition
                                group-hover:bg-[#FF6B0B]/15
                              "
                            >

                              <Users
                                className="
                                  size-5
                                  text-[#FF6B0B]
                                "
                              />

                            </div>

                            <div className="min-w-0">

                              <p
                                className="
                                  font-semibold
                                  text-slate-900
                                  dark:text-white
                                "
                              >
                                {cohortName}
                              </p>

                              {cohorte.description && (
                                <p
                                  className="
                                    mt-1
                                    max-w-[260px]
                                    truncate
                                    text-xs
                                    text-slate-500
                                    dark:text-slate-400
                                  "
                                >
                                  {cohorte.description}
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* RENTRÉE */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2.5">

                            <div
                              className="
                                flex
                                size-8
                                items-center
                                justify-center
                                rounded-lg
                                bg-purple-500/10
                              "
                            >

                              <Calendar
                                className="
                                  size-4
                                  text-purple-500
                                "
                              />

                            </div>

                            <span
                              className="
                                text-sm
                                font-medium
                                text-slate-700
                                dark:text-slate-300
                              "
                            >
                              {isRentreesLoading
                                ? 'Chargement...'
                                : rentreeName}
                            </span>

                          </div>

                        </td>

                        {/* PÉRIODE */}

                        <td className="px-6 py-5">

                          <div className="flex flex-col">

                            <span
                              className="
                                text-sm
                                font-medium
                                text-slate-700
                                dark:text-slate-300
                              "
                            >
                              {formatDate(
                                startDate,
                              )}
                            </span>

                            <span
                              className="
                                mt-0.5
                                text-xs
                                text-slate-400
                              "
                            >
                              au{' '}
                              {formatDate(
                                endDate,
                              )}
                            </span>

                          </div>

                        </td>

                        {/* STATUT */}

                        <td className="px-6 py-5">

                          <StatusBadge
                            status={cohortStatus}
                          />

                        </td>

                        {/* ACTION */}

                        {!isLearner && (
                          <td className="px-6 py-5">

                            <div className="flex justify-end">

                              <Button
                                variant="outline"
                                onClick={() =>
                                  navigate(
                                    `/cohortes/${cohorte.id}`,
                                  )
                                }
                                className="
                                  gap-2
                                  rounded-xl
                                  border-slate-200
                                  font-semibold
                                  transition
                                  group-hover:border-[#FF6B0B]/30
                                  group-hover:text-[#FF6B0B]
                                  dark:border-white/10
                                "
                              >

                                Voir

                                <ChevronRight
                                  className="
                                    size-4
                                  "
                                />

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
          INFORMATIONS COMPLÉMENTAIRES
          UNIQUEMENT POUR ADMIN / ORGANIZER / TRAINER
      ====================================================== */}

      {!isLearner && (
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-white/10
            dark:bg-[#151528]
          "
        >

          <div className="mb-5">

            <h2
              className="
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Informations complémentaires
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Informations techniques du programme.
            </p>

          </div>

          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
            "
          >

            {/* ID */}

            <div
              className="
                rounded-xl
                bg-slate-50
                p-4
                dark:bg-white/[0.03]
              "
            >

              <p
                className="
                  mb-1
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Identifiant
              </p>

              <p
                className="
                  break-all
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {programme.id}
              </p>

            </div>

            {/* MODIFICATION */}

            <div
              className="
                rounded-xl
                bg-slate-50
                p-4
                dark:bg-white/[0.03]
              "
            >

              <p
                className="
                  mb-1
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Dernière modification
              </p>

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {formatDate(
                  programme.updated_at,
                )}
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default ProgrammeDetailPage