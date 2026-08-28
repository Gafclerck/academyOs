import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Plus,
  Users,
  Calendar,
  Eye,
  RefreshCw,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Clock3,
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

import { useCohortes } from '@/hooks/cohortes/useCohortes'
import { useProgrammes } from '@/hooks/useProgrammes'
import { useRentrees } from '@/hooks/rentrees/useRentrees'

import type { Cohorte } from '@/types/cohorte'

import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'

import {
  DataTable,
  type ColumnDef,
} from '@/components/ui/DataTable'

import { Button } from '@/components/ui/button'

// ============================================================
// MAIN COMPONENT
// ============================================================

export const CohorteListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ==========================================================
  // UTILISATEUR CONNECTÉ
  // ==========================================================

  const role = user?.role

  const isAdmin = role === 'admin'
  const isOrganizer = role === 'organizer'
  const isTrainer = role === 'trainer'
  const isLearner = role === 'learner'

  // ==========================================================
  // PERSONNALISATION
  // ==========================================================

  const pageTitle = isAdmin
    ? 'Cohortes'
    : isOrganizer
      ? 'Mes cohortes'
      : isTrainer
        ? 'Mes cohortes'
        : 'Ma cohorte'

  const pageDescription = isAdmin
    ? 'Gérez l’ensemble des cohortes de la plateforme.'
    : isOrganizer
      ? 'Gérez les cohortes de vos programmes.'
      : isTrainer
        ? 'Retrouvez les cohortes qui vous sont assignées.'
        : 'Retrouvez les informations relatives à votre parcours.'

  // ==========================================================
  // CRÉATION
  // ==========================================================
  // Seul l'administrateur peut créer une cohorte.
  //
  // IMPORTANT :
  // L'organisateur ne doit PAS voir le bouton "Nouvelle cohorte".
  // ==========================================================

  const showCreateButton = isAdmin

  // ==========================================================
  // COHORTES
  // ==========================================================

  const {
    data: cohortes = [],
    isLoading: cohortesLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCohortes()

  // ==========================================================
  // PROGRAMMES
  // ==========================================================

  const {
    data: programmes = [],
    isLoading: programmesLoading,
  } = useProgrammes()

  // ==========================================================
  // RENTRÉES
  // ==========================================================

  const {
    data: rentrees = [],
    isLoading: rentreesLoading,
  } = useRentrees()

  // ==========================================================
  // LOADING
  // ==========================================================

  const isLoading =
    cohortesLoading ||
    programmesLoading ||
    rentreesLoading

  // ==========================================================
  // MAP PROGRAMMES
  // ==========================================================

  const programmeMap = useMemo(() => {
    const map = new Map<string, string>()

    programmes.forEach((programme) => {
      map.set(
        String(programme.id),
        programme.nom,
      )
    })

    return map
  }, [programmes])

  // ==========================================================
  // MAP RENTRÉES
  // ==========================================================

  const rentreeMap = useMemo(() => {
    const map = new Map<string, string>()

    rentrees.forEach((rentree) => {
      map.set(
        String(rentree.id),
        rentree.name,
      )
    })

    return map
  }, [rentrees])

  // ==========================================================
  // KPI
  // ==========================================================

  const totalCohortes = cohortes.length

  const cohortesEnCours = cohortes.filter(
    (cohorte) =>
      cohorte.status === 'ongoing' ||
      cohorte.status === 'active',
  ).length

  const cohortesAVenir = cohortes.filter(
    (cohorte) =>
      cohorte.status === 'upcoming',
  ).length

  // ==========================================================
  // TABLE ADMIN / ORGANIZER
  // ==========================================================

  const columns = useMemo<
    ColumnDef<Cohorte>[]
  >(
    () => [
      {
        accessorKey: 'name',

        header: 'Nom de la cohorte',

        cell: ({ row }) => {
          const cohorte = row.original

          return (
            <div className="flex items-center gap-3">
              <div
                className="
                  flex size-10 shrink-0
                  items-center justify-center
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

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {cohorte.name || 'Sans nom'}
                </p>
              </div>
            </div>
          )
        },
      },

      // ======================================================
      // PROGRAMME
      // ======================================================

      {
        accessorKey: 'program',

        header: 'Programme',

        cell: ({ row }) => {
          const cohorte = row.original

          const programmeName =
            cohorte.program_name ||
            programmeMap.get(
              String(cohorte.program),
            )

          return (
            <span
              className="
                text-sm
                font-medium
                text-slate-700
                dark:text-slate-300
              "
            >
              {programmeName || '—'}
            </span>
          )
        },
      },

      // ======================================================
      // RENTRÉE
      // ======================================================

      {
        accessorKey: 'intake',

        header: 'Rentrée',

        cell: ({ row }) => {
          const cohorte = row.original

          const rentreeName =
            cohorte.intake_name ||
            rentreeMap.get(
              String(cohorte.intake),
            )

          return (
            <span
              className="
                text-sm
                font-medium
                text-slate-700
                dark:text-slate-300
              "
            >
              {rentreeName || '—'}
            </span>
          )
        },
      },

      // ======================================================
      // DÉBUT
      // ======================================================

      {
        accessorKey: 'start_date',

        header: 'Début',

        cell: ({ row }) => (
          <span
            className="
              text-xs
              font-medium
              text-slate-600
              dark:text-slate-300
            "
          >
            {formatDate(
              row.original.start_date,
            )}
          </span>
        ),
      },

      // ======================================================
      // FIN
      // ======================================================

      {
        accessorKey: 'end_date',

        header: 'Fin',

        cell: ({ row }) => (
          <span
            className="
              text-xs
              font-medium
              text-slate-600
              dark:text-slate-300
            "
          >
            {formatDate(
              row.original.end_date,
            )}
          </span>
        ),
      },

      // ======================================================
      // STATUT
      // ======================================================

      {
        accessorKey: 'status',

        header: 'Statut',

        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
          />
        ),
      },

      // ======================================================
      // ACTIONS
      // ======================================================

      {
        id: 'actions',

        header: () => (
          <div className="pr-2 text-right">
            Actions
          </div>
        ),

        cell: ({ row }) => {
          const cohorte = row.original

          return (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/cohortes/${cohorte.id}`,
                  )
                }
                className="
                  h-8
                  rounded-xl
                  border-[#FF6B0B]/30
                  px-3
                  text-xs
                  font-semibold
                  text-[#FF6B0B]
                  hover:border-[#FF6B0B]
                  hover:bg-[#FF6B0B]
                  hover:text-white
                "
              >
                <Eye className="mr-1.5 size-3.5" />

                Voir détails
              </Button>
            </div>
          )
        },
      },
    ],
    [
      navigate,
      programmeMap,
      rentreeMap,
    ],
  )

  // ==========================================================
  // VUE APPRENANT
  // ==========================================================

  const maCohorte = isLearner
    ? cohortes[0]
    : undefined

  const maCohorteProgramme =
    maCohorte?.program_name ||
    (maCohorte
      ? programmeMap.get(
          String(maCohorte.program),
        )
      : undefined)

  const maCohorteRentree =
    maCohorte?.intake_name ||
    (maCohorte
      ? rentreeMap.get(
          String(maCohorte.intake),
        )
      : undefined)

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          items-start
          justify-between
          gap-4
          sm:flex-row
          sm:items-center
        "
      >
        <div>

          <div className="mb-1 flex items-center gap-2">

            {isAdmin ? (
              <ShieldCheck
                className="size-4 text-[#FF6B0B]"
              />
            ) : isOrganizer ? (
              <BriefcaseBusiness
                className="size-4 text-[#FF6B0B]"
              />
            ) : (
              <GraduationCap
                className="size-4 text-[#FF6B0B]"
              />
            )}

            <span
              className="
                text-sm
                font-semibold
                text-[#FF6B0B]
              "
            >
              {isAdmin
                ? 'Administrateur'
                : isOrganizer
                  ? 'Organisateur'
                  : isTrainer
                    ? 'Formateur'
                    : 'Apprenant'}
            </span>

          </div>

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
            {pageTitle}
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            {pageDescription}
          </p>

        </div>

        {/* ====================================================
            NOUVELLE COHORTE
            ADMIN UNIQUEMENT
        ==================================================== */}

        {showCreateButton && (
          <Button
            onClick={() =>
              navigate('/cohortes/new')
            }
            className="
              h-11
              rounded-xl
              bg-[#FF6B0B]
              px-5
              font-semibold
              text-white
              shadow-lg
              shadow-[#FF6B0B]/25
              hover:bg-[#ff7a24]
            "
          >
            <Plus className="mr-2 size-4" />

            Nouvelle cohorte
          </Button>
        )}

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {isError && (
        <ErrorMessage
          error={error}
          refetch={refetch}
          isFetching={isFetching}
        />
      )}

      {/* ======================================================
          APPRENANT
      ====================================================== */}

      {isLearner ? (

        <LearnerView
          maCohorte={maCohorte}
          programmeName={maCohorteProgramme}
          rentreeName={maCohorteRentree}
          isLoading={isLoading}
        />

      ) : isTrainer ? (

        /* ====================================================
           FORMATEUR
        ==================================================== */

        <TrainerView
          cohortes={cohortes}
          programmeMap={programmeMap}
          rentreeMap={rentreeMap}
          isLoading={isLoading}
          isError={isError}
          navigate={navigate}
          totalCohortes={totalCohortes}
          cohortesEnCours={cohortesEnCours}
          cohortesAVenir={cohortesAVenir}
        />

      ) : (

        /* ====================================================
           ADMIN / ORGANIZER
        ==================================================== */

        <>
          <div
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-[#FF6B0B]/10
              bg-[#FF6B0B]/5
              px-4
              py-3
              dark:border-[#FF6B0B]/20
              dark:bg-[#FF6B0B]/10
            "
          >
            <div
              className="
                flex
                size-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[#FF6B0B]/10
                text-[#FF6B0B]
              "
            >
              <Users className="size-4" />
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
                {isAdmin
                  ? 'Vue globale'
                  : 'Vos cohortes'}
              </p>

              <p
                className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {isAdmin
                  ? 'Vous avez accès à l’ensemble des cohortes.'
                  : 'Les cohortes accessibles depuis votre espace.'}
              </p>
            </div>
          </div>

          {/* ==================================================
              KPI
          ================================================== */}

          <div
            className="
              grid
              grid-cols-2
              gap-4
              lg:grid-cols-3
            "
          >
            <StatCard
              title="Total Cohortes"
              value={totalCohortes}
              subtitle="Cohortes enregistrées"
              icon={Users}
            />

            <StatCard
              title="En cours"
              value={cohortesEnCours}
              subtitle="Cohortes actives"
              icon={Calendar}
            />

            <StatCard
              title="À venir"
              value={cohortesAVenir}
              subtitle="Cohortes planifiées"
              icon={Calendar}
            />
          </div>

          {/* ==================================================
              TABLE
          ================================================== */}

          <DataTable
            columns={columns}
            data={cohortes}
            isLoading={isLoading}
            searchPlaceholder="Rechercher une cohorte..."
            emptyMessage={
              isError
                ? 'Impossible de charger les cohortes.'
                : 'Aucune cohorte enregistrée.'
            }
          />
        </>

      )}

    </div>
  )
}

// ============================================================
// TRAINER VIEW
// ============================================================

interface TrainerViewProps {
  cohortes: Cohorte[]
  programmeMap: Map<string, string>
  rentreeMap: Map<string, string>
  isLoading: boolean
  isError: boolean
  navigate: ReturnType<typeof useNavigate>
  totalCohortes: number
  cohortesEnCours: number
  cohortesAVenir: number
}

const TrainerView: React.FC<TrainerViewProps> = ({
  cohortes,
  programmeMap,
  rentreeMap,
  isLoading,
  isError,
  navigate,
  totalCohortes,
  cohortesEnCours,
  cohortesAVenir,
}) => {

  return (
    <div className="space-y-7">

      {/* ======================================================
          INTRO
      ====================================================== */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-sm
          dark:border-white/10
          dark:bg-white/[0.04]
        "
      >

        <div
          className="
            absolute
            -right-16
            -top-20
            size-56
            rounded-full
            bg-[#FF6B0B]/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-20
            -left-16
            size-48
            rounded-full
            bg-orange-100/60
            blur-3xl
            dark:bg-orange-500/5
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-5
            p-6
            sm:p-7
            md:flex-row
            md:items-center
            md:justify-between
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
                bg-[#FF6B0B]
                text-white
                shadow-lg
                shadow-[#FF6B0B]/20
              "
            >
              <GraduationCap className="size-7" />
            </div>

            <div>

              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-[#FF6B0B]
                "
              >
                Espace formateur
              </p>

              <h2
                className="
                  mt-1
                  text-xl
                  font-extrabold
                  tracking-tight
                  text-slate-900
                  dark:text-white
                  sm:text-2xl
                "
              >
                Mes cohortes
              </h2>

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
                Retrouvez les cohortes auxquelles
                vous êtes assigné et consultez
                rapidement les informations de vos
                groupes de formation.
              </p>

            </div>

          </div>

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
              rounded-2xl
              bg-[#FF6B0B]/10
              px-4
              py-3
            "
          >
            <Users
              className="
                size-5
                text-[#FF6B0B]
              "
            />

            <div>
              <p
                className="
                  text-lg
                  font-extrabold
                  text-slate-900
                  dark:text-white
                "
              >
                {totalCohortes}
              </p>

              <p
                className="
                  text-[11px]
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                cohorte
                {totalCohortes > 1 ? 's' : ''}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================
          KPI
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-3
        "
      >

        <StatCard
          title="Mes cohortes"
          value={totalCohortes}
          subtitle="Cohortes assignées"
          icon={Users}
        />

        <StatCard
          title="En cours"
          value={cohortesEnCours}
          subtitle="Formations actives"
          icon={Clock3}
          trend="Actives"
        />

        <StatCard
          title="À venir"
          value={cohortesAVenir}
          subtitle="Formations planifiées"
          icon={CalendarDays}
        />

      </div>

      {/* ======================================================
          TITRE
      ====================================================== */}

      <div>

        <h2
          className="
            text-xl
            font-bold
            text-slate-900
            dark:text-white
          "
        >
          Mes cohortes
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          Les cohortes qui vous sont actuellement
          assignées.
        </p>

      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {isLoading && (
        <TrainerCohorteSkeleton />
      )}

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!isLoading &&
        !isError &&
        cohortes.length === 0 && (
          <TrainerCohorteEmpty />
        )}

      {/* ======================================================
          CARDS
      ====================================================== */}

      {!isLoading &&
        !isError &&
        cohortes.length > 0 && (
          <div
            className="
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {cohortes.map((cohorte) => (
              <TrainerCohorteCard
                key={cohorte.id}
                cohorte={cohorte}
                programmeName={
                  cohorte.program_name ||
                  programmeMap.get(
                    String(cohorte.program),
                  )
                }
                rentreeName={
                  cohorte.intake_name ||
                  rentreeMap.get(
                    String(cohorte.intake),
                  )
                }
                navigate={navigate}
              />
            ))}
          </div>
        )}

    </div>
  )
}

// ============================================================
// TRAINER CARD
// ============================================================

interface TrainerCohorteCardProps {
  cohorte: Cohorte
  programmeName?: string
  rentreeName?: string
  navigate: ReturnType<typeof useNavigate>
}

const TrainerCohorteCard: React.FC<
  TrainerCohorteCardProps
> = ({
  cohorte,
  programmeName,
  rentreeName,
  navigate,
}) => {

  const isOngoing =
    cohorte.status === 'ongoing' ||
    cohorte.status === 'active'

  const isUpcoming =
    cohorte.status === 'upcoming'

  return (
    <article
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        dark:border-white/10
        dark:bg-white/[0.04]
      "
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="
          relative
          h-32
          overflow-hidden
          bg-gradient-to-br
          from-orange-500
          via-[#FF6B0B]
          to-orange-300
        "
      >

        <div
          className="
            absolute
            -right-8
            -top-10
            size-36
            rounded-full
            bg-white/10
          "
        />

        <div
          className="
            absolute
            -bottom-12
            left-12
            size-28
            rounded-full
            bg-white/10
          "
        />

        <div
          className="
            relative
            z-10
            flex
            h-full
            items-center
            justify-between
            px-5
          "
        >

          <div
            className="
              flex
              size-12
              items-center
              justify-center
              rounded-2xl
              bg-white/15
              text-white
              backdrop-blur
            "
          >
            <Users className="size-6" />
          </div>

          <StatusBadge
            status={cohorte.status}
          />

        </div>

      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="p-5">

        <div>

          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-[#FF6B0B]
            "
          >
            Cohorte assignée
          </p>

          <h3
            className="
              mt-1
              line-clamp-2
              min-h-[52px]
              text-lg
              font-extrabold
              leading-6
              text-slate-900
              dark:text-white
            "
          >
            {cohorte.name ||
              'Cohorte sans nom'}
          </h3>

        </div>

        {/* PROGRAMME */}

        <div
          className="
            mt-5
            flex
            items-center
            gap-3
            rounded-xl
            bg-slate-50
            px-3
            py-3
            dark:bg-white/[0.04]
          "
        >

          <div
            className="
              flex
              size-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[#FF6B0B]/10
              text-[#FF6B0B]
            "
          >
            <BookOpen className="size-4" />
          </div>

          <div className="min-w-0">

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Programme
            </p>

            <p
              className="
                mt-0.5
                truncate
                text-sm
                font-bold
                text-slate-700
                dark:text-slate-200
              "
            >
              {programmeName || '—'}
            </p>

          </div>

        </div>

        {/* RENTRÉE */}

        <div
          className="
            mt-3
            flex
            items-center
            gap-3
            rounded-xl
            bg-slate-50
            px-3
            py-3
            dark:bg-white/[0.04]
          "
        >

          <div
            className="
              flex
              size-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[#FF6B0B]/10
              text-[#FF6B0B]
            "
          >
            <CalendarDays className="size-4" />
          </div>

          <div className="min-w-0">

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Rentrée
            </p>

            <p
              className="
                mt-0.5
                truncate
                text-sm
                font-bold
                text-slate-700
                dark:text-slate-200
              "
            >
              {rentreeName || '—'}
            </p>

          </div>

        </div>

        {/* PÉRIODE */}

        <div
          className="
            mt-3
            flex
            items-center
            gap-3
            rounded-xl
            bg-slate-50
            px-3
            py-3
            dark:bg-white/[0.04]
          "
        >

          <div
            className="
              flex
              size-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-blue-500/10
              text-blue-500
            "
          >
            <Clock3 className="size-4" />
          </div>

          <div>

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Période
            </p>

            <p
              className="
                mt-0.5
                text-sm
                font-bold
                text-slate-700
                dark:text-slate-200
              "
            >
              {formatDate(
                cohorte.start_date,
              )}{' '}
              —{' '}
              {formatDate(
                cohorte.end_date,
              )}
            </p>

          </div>

        </div>

        {/* ÉTAT */}

        <div
          className="
            mt-3
            flex
            items-center
            gap-3
            rounded-xl
            bg-slate-50
            px-3
            py-3
            dark:bg-white/[0.04]
          "
        >

          <div
            className={`
              flex
              size-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              ${
                isOngoing
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isUpcoming
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-500/10 text-slate-500'
              }
            `}
          >
            <Calendar className="size-4" />
          </div>

          <div>

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              État
            </p>

            <p
              className="
                mt-0.5
                text-sm
                font-bold
                text-slate-700
                dark:text-slate-200
              "
            >
              {isOngoing
                ? 'Formation en cours'
                : isUpcoming
                  ? 'Formation à venir'
                  : 'Formation terminée'}
            </p>

          </div>

        </div>

        {/* ACTION */}

        <button
          type="button"
          onClick={() =>
            navigate(
              `/cohortes/${cohorte.id}`,
            )
          }
          className="
            mt-5
            flex
            w-full
            items-center
            justify-between
            rounded-xl
            bg-slate-900
            px-4
            py-3
            text-sm
            font-bold
            text-white
            transition-all
            hover:bg-[#FF6B0B]
            dark:bg-white
            dark:text-slate-900
            dark:hover:bg-[#FF6B0B]
            dark:hover:text-white
          "
        >

          <span>
            Voir ma cohorte
          </span>

          <ArrowRight
            className="
              size-4
              transition-transform
              group-hover:translate-x-1
            "
          />

        </button>

      </div>

    </article>
  )
}

// ============================================================
// LEARNER VIEW
// ============================================================

interface LearnerViewProps {
  maCohorte?: Cohorte
  programmeName?: string
  rentreeName?: string
  isLoading: boolean
}

const LearnerView: React.FC<
  LearnerViewProps
> = ({
  maCohorte,
  programmeName,
  rentreeName,
  isLoading,
}) => {

  if (isLoading) {
    return <LearnerCohorteSkeleton />
  }

  if (!maCohorte) {
    return (
      <div
        className="
          flex
          min-h-[420px]
          flex-col
          items-center
          justify-center
          rounded-3xl
          border
          border-dashed
          border-slate-200
          bg-white
          px-6
          text-center
          dark:border-white/10
          dark:bg-white/[0.02]
        "
      >

        <div
          className="
            flex
            size-16
            items-center
            justify-center
            rounded-2xl
            bg-[#FF6B0B]/10
            text-[#FF6B0B]
          "
        >
          <GraduationCap className="size-8" />
        </div>

        <h2
          className="
            mt-5
            text-xl
            font-bold
            text-slate-900
            dark:text-white
          "
        >
          Aucune cohorte associée
        </h2>

        <p
          className="
            mt-2
            max-w-md
            text-sm
            leading-6
            text-slate-500
            dark:text-slate-400
          "
        >
          Vous n’êtes actuellement associé
          à aucune cohorte.
        </p>

      </div>
    )
  }

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-sm
        dark:border-white/10
        dark:bg-white/[0.04]
      "
    >

      <div
        className="
          absolute
          -right-20
          -top-20
          size-64
          rounded-full
          bg-[#FF6B0B]/10
          blur-3xl
        "
      />

      <div
        className="
          relative
          p-6
          sm:p-8
        "
      >

        <div
          className="
            flex
            flex-col
            gap-5
            md:flex-row
            md:items-start
            md:justify-between
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
                bg-[#FF6B0B]
                text-white
              "
            >
              <GraduationCap className="size-7" />
            </div>

            <div>

              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-[#FF6B0B]
                "
              >
                Ma cohorte
              </p>

              <h2
                className="
                  mt-1
                  text-2xl
                  font-extrabold
                  text-slate-900
                  dark:text-white
                  sm:text-3xl
                "
              >
                {maCohorte.name || 'Sans nom'}
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Retrouvez les informations
                essentielles de votre parcours.
              </p>

            </div>

          </div>

          <StatusBadge
            status={maCohorte.status}
          />

        </div>

        {/* ==================================================
            INFORMATIONS
        ================================================== */}

        <div
          className="
            mt-8
            grid
            gap-3
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >

          <InfoBox
            icon={BookOpen}
            label="Programme"
            value={programmeName || '—'}
          />

          <InfoBox
            icon={CalendarDays}
            label="Rentrée"
            value={rentreeName || '—'}
          />

          <InfoBox
            icon={Clock3}
            label="Période"
            value={`${formatDate(
              maCohorte.start_date,
            )} — ${formatDate(
              maCohorte.end_date,
            )}`}
          />

        </div>

        {/* ==================================================
            PÉRIODE DE FORMATION
        ================================================== */}

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-5
            dark:border-white/10
            dark:bg-white/[0.02]
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <InfoBox
              icon={Calendar}
              label="Début de la formation"
              value={formatDate(
                maCohorte.start_date,
              )}
            />

            <div
              className="
                hidden
                h-px
                flex-1
                bg-slate-200
                sm:block
                dark:bg-white/10
              "
            />

            <InfoBox
              icon={Calendar}
              label="Fin de la formation"
              value={formatDate(
                maCohorte.end_date,
              )}
            />

          </div>

        </div>

      </div>
    </div>
  )
}

// ============================================================
// INFO BOX
// ============================================================

interface InfoBoxProps {
  icon: React.ElementType
  label: string
  value: string
}

const InfoBox: React.FC<InfoBoxProps> = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div
      className="
        flex
        items-center
        gap-3
      "
    >

      <div
        className="
          flex
          size-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-[#FF6B0B]/10
          text-[#FF6B0B]
        "
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0">

        <p
          className="
            text-xs
            font-medium
            text-slate-400
            dark:text-slate-500
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            truncate
            text-sm
            font-bold
            text-slate-900
            dark:text-white
          "
        >
          {value}
        </p>

      </div>

    </div>
  )
}

// ============================================================
// TRAINER EMPTY
// ============================================================

const TrainerCohorteEmpty: React.FC = () => {
  return (
    <div
      className="
        flex
        min-h-[350px]
        flex-col
        items-center
        justify-center
        rounded-3xl
        border
        border-dashed
        border-slate-300
        bg-white
        px-6
        text-center
        dark:border-white/10
        dark:bg-white/[0.03]
      "
    >

      <div
        className="
          flex
          size-16
          items-center
          justify-center
          rounded-2xl
          bg-[#FF6B0B]/10
          text-[#FF6B0B]
        "
      >
        <Users className="size-8" />
      </div>

      <h3
        className="
          mt-5
          text-lg
          font-bold
          text-slate-900
          dark:text-white
        "
      >
        Aucune cohorte assignée
      </h3>

      <p
        className="
          mt-2
          max-w-md
          text-sm
          leading-6
          text-slate-500
          dark:text-slate-400
        "
      >
        Les cohortes qui vous seront
        attribuées apparaîtront ici.
      </p>

    </div>
  )
}

// ============================================================
// TRAINER SKELETON
// ============================================================

const TrainerCohorteSkeleton: React.FC = () => {
  return (
    <div
      className="
        grid
        gap-5
        md:grid-cols-2
        xl:grid-cols-3
      "
    >
      {Array.from({ length: 3 }).map(
        (_, index) => (
          <div
            key={index}
            className="
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-white
              dark:border-white/10
              dark:bg-white/[0.04]
            "
          >

            <div
              className="
                h-32
                animate-pulse
                bg-slate-200
                dark:bg-white/10
              "
            />

            <div className="space-y-4 p-5">

              <div
                className="
                  h-3
                  w-28
                  animate-pulse
                  rounded
                  bg-slate-200
                  dark:bg-white/10
                "
              />

              <div
                className="
                  h-6
                  w-3/4
                  animate-pulse
                  rounded
                  bg-slate-200
                  dark:bg-white/10
                "
              />

              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="
                      h-12
                      animate-pulse
                      rounded-xl
                      bg-slate-100
                      dark:bg-white/5
                    "
                  />
                ),
              )}

              <div
                className="
                  h-11
                  animate-pulse
                  rounded-xl
                  bg-slate-200
                  dark:bg-white/10
                "
              />

            </div>

          </div>
        ),
      )}
    </div>
  )
}

// ============================================================
// ERROR
// ============================================================

interface ErrorMessageProps {
  error: unknown
  refetch: () => void
  isFetching: boolean
}

const ErrorMessage: React.FC<
  ErrorMessageProps
> = ({
  error,
  refetch,
  isFetching,
}) => {
  return (
    <div
      className="
        flex
        flex-col
        gap-4
        rounded-2xl
        border
        border-red-200
        bg-red-50
        p-4
        sm:flex-row
        sm:items-center
        sm:justify-between
        dark:border-red-500/20
        dark:bg-red-500/10
      "
    >

      <div>

        <p
          className="
            font-semibold
            text-red-700
            dark:text-red-400
          "
        >
          Impossible de récupérer
          les cohortes.
        </p>

        <p
          className="
            mt-1
            text-xs
            text-red-600
            dark:text-red-300
          "
        >
          {error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la requête API.'}
        </p>

      </div>

      <Button
        variant="outline"
        onClick={() => refetch()}
        disabled={isFetching}
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
  )
}

// ============================================================
// LEARNER SKELETON
// ============================================================

const LearnerCohorteSkeleton: React.FC = () => {
  return (
    <div
      className="
        animate-pulse
        overflow-hidden
        rounded-3xl
        border
        border-slate-200
        bg-white
        dark:border-white/10
        dark:bg-white/[0.04]
      "
    >

      <div className="p-6 sm:p-8">

        <div className="flex items-start gap-4">

          <div
            className="
              size-14
              shrink-0
              rounded-2xl
              bg-slate-200
              dark:bg-white/10
            "
          />

          <div className="flex-1">

            <div
              className="
                h-3
                w-24
                rounded
                bg-slate-200
                dark:bg-white/10
              "
            />

            <div
              className="
                mt-3
                h-8
                w-64
                rounded
                bg-slate-200
                dark:bg-white/10
              "
            />

            <div
              className="
                mt-3
                h-4
                max-w-xl
                rounded
                bg-slate-200
                dark:bg-white/10
              "
            />

          </div>

        </div>

        <div
          className="
            mt-8
            grid
            gap-3
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="
                h-20
                rounded-2xl
                bg-slate-100
                dark:bg-white/5
              "
            />
          ))}

        </div>

        <div
          className="
            mt-6
            h-20
            rounded-2xl
            bg-slate-100
            dark:bg-white/5
          "
        />

      </div>

    </div>
  )
}

// ============================================================
// FORMAT DATE
// ============================================================

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
      month: '2-digit',
      year: 'numeric',
    },
  )
}

export default CohorteListPage