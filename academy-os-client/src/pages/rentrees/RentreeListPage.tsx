
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Calendar,
  Eye,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  GraduationCap,
  BriefcaseBusiness,
  ShieldCheck,
  ArrowRight,
  Clock3,
} from 'lucide-react'

import { useRentrees } from '@/hooks/rentrees/useRentrees'
import type { Rentree } from '@/types/rentree'

import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type ColumnDef } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

// ============================================================
// TYPES
// ============================================================

type UserRole =
  | 'admin'
  | 'organizer'
  | 'trainer'
  | 'learner'

type StatusFilter =
  | 'all'
  | 'ongoing'
  | 'upcoming'
  | 'completed'
  | 'inactive'

// ============================================================
// HELPERS
// ============================================================

const getRoleLabel = (role?: UserRole) => {
  switch (role) {
    case 'admin':
      return 'Administrateur'

    case 'organizer':
      return 'Organisateur'

    case 'trainer':
      return 'Formateur'

    case 'learner':
      return 'Apprenant'

    default:
      return 'Utilisateur'
  }
}

const getFirstName = (user: any) => {
  if (!user) return 'Utilisateur'

  if (user.first_name) {
    return user.first_name
  }

  if (user.full_name) {
    return user.full_name.split(' ')[0]
  }

  if (user.name) {
    return user.name.split(' ')[0]
  }

  return 'Utilisateur'
}

const rentreeDate = (date?: string): string => {
  if (!date) {
    return '—'
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'ongoing':
      return 'En cours'

    case 'upcoming':
      return 'À venir'

    case 'completed':
      return 'Terminée'

    case 'inactive':
      return 'Inactive'

    default:
      return status || 'Inconnu'
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export const RentreeListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')

  // ============================================================
  // ROLE
  // ============================================================

  const role =
    (user?.role as UserRole | undefined) ??
    'learner'

  const firstName = getFirstName(user)

  // ============================================================
  // RENTREES
  // ============================================================

  const {
    data: rentrees = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useRentrees()

  // ============================================================
  // FILTER
  // ============================================================

  const filteredRentrees = useMemo(() => {
    let result = [...rentrees]

    if (statusFilter !== 'all') {
      result = result.filter(
        (rentree) =>
          rentree.status === statusFilter,
      )
    }

    if (search.trim()) {
      const query = search
        .trim()
        .toLowerCase()

      result = result.filter((rentree) => {
        const name =
          rentree.name?.toLowerCase() ?? ''

        return name.includes(query)
      })
    }

    return result
  }, [
    rentrees,
    search,
    statusFilter,
  ])

  // ============================================================
  // KPIs
  // ============================================================

  const totalRentrees = rentrees.length

  const rentreesActives = rentrees.filter(
    (rentree) =>
      rentree.status === 'ongoing',
  ).length

  const rentreesAVenir = rentrees.filter(
    (rentree) =>
      rentree.status === 'upcoming',
  ).length

  // ============================================================
  // TABLE ADMIN / ORGANIZER
  // ============================================================

  const columns = useMemo<
    ColumnDef<Rentree>[]
  >(
    () => [
      {
        accessorKey: 'name',

        header: 'Nom de la Rentrée',

        cell: ({ row }) => {
          const rentree = row.original

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
                <Calendar
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
                  {rentree.name || 'Sans nom'}
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-slate-400
                  "
                >
                  Promotion académique
                </p>
              </div>
            </div>
          )
        },
      },

      {
        accessorKey: 'start_date',

        header: 'Date de début',

        cell: ({ row }) => (
          <span
            className="
              text-xs
              font-medium
              text-slate-600
              dark:text-slate-300
            "
          >
            {rentreeDate(
              row.original.start_date,
            )}
          </span>
        ),
      },

      {
        accessorKey: 'status',

        header: 'Statut',

        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
          />
        ),
      },

      {
        id: 'actions',

        header: () => (
          <div className="pr-2 text-right">
            Actions
          </div>
        ),

        cell: ({ row }) => {
          const rentree = row.original

          return (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/rentrees/${rentree.id}`,
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
    [navigate],
  )

  // ============================================================
  // LEARNER
  // ============================================================

  if (role === 'learner') {
    return (
      <LearnerRentreeView
        rentrees={filteredRentrees}
        totalRentrees={rentrees.length}
        firstName={firstName}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        navigate={navigate}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={refetch}
        isFetching={isFetching}
      />
    )
  }

  // ============================================================
  // TRAINER
  // ============================================================

  if (role === 'trainer') {
    return (
      <TrainerRentreeView
        rentrees={filteredRentrees}
        totalRentrees={rentrees.length}
        firstName={firstName}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        navigate={navigate}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={refetch}
        isFetching={isFetching}
        rentreesActives={rentreesActives}
        rentreesAVenir={rentreesAVenir}
      />
    )
  }

  // ============================================================
  // ADMIN / ORGANIZER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

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

            {role === 'admin' ? (
              <ShieldCheck
                className="size-4 text-[#FF6B0B]"
              />
            ) : (
              <BriefcaseBusiness
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
              {getRoleLabel(role)}
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
            {role === 'admin'
              ? 'Toutes les Rentrées'
              : 'Rentrées académiques'}
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            {role === 'admin'
              ? 'Gérez et supervisez l’ensemble des rentrées académiques.'
              : 'Gérez les rentrées associées aux programmes que vous pilotez.'}
          </p>

        </div>

        <Button
          onClick={() =>
            navigate('/rentrees/new')
          }
          className="
            h-11
            shrink-0
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
          Nouvelle Rentrée
        </Button>

      </div>

      {/* ERROR */}

      {isError && (
        <ErrorMessage
          error={error}
          refetch={refetch}
          isFetching={isFetching}
        />
      )}

      {/* KPI */}

      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-3
        "
      >

        <StatCard
          title="Total Rentrées"
          value={totalRentrees}
          subtitle="Rentrées enregistrées"
          icon={Calendar}
        />

        <StatCard
          title="Rentrées Actives"
          value={rentreesActives}
          subtitle="En cours"
          icon={Clock3}
          trend="Actives"
        />

        <StatCard
          title="À venir"
          value={rentreesAVenir}
          subtitle="Rentrées planifiées"
          icon={Calendar}
        />

      </div>

      {/* SEARCH */}

      <div
        className="
          flex
          flex-col
          gap-3
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <SearchBar
          search={search}
          setSearch={setSearch}
          placeholder="Rechercher une rentrée..."
        />

        <StatusSelect
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

      </div>

      {/* TABLE */}

      <DataTable
        columns={columns}
        data={filteredRentrees}
        isLoading={isLoading}
        hideSearch
        emptyMessage={
          isError
            ? 'Impossible de charger les rentrées.'
            : 'Aucune rentrée trouvée.'
        }
      />

    </div>
  )
}

// ============================================================
// TRAINER VIEW
// ============================================================

interface TrainerRentreeViewProps {
  rentrees: Rentree[]
  totalRentrees: number
  firstName: string
  search: string
  setSearch: React.Dispatch<
    React.SetStateAction<string>
  >
  statusFilter: StatusFilter
  setStatusFilter: React.Dispatch<
    React.SetStateAction<StatusFilter>
  >
  navigate: ReturnType<typeof useNavigate>
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  isFetching: boolean
  rentreesActives: number
  rentreesAVenir: number
}

const TrainerRentreeView: React.FC<
  TrainerRentreeViewProps
> = ({
  rentrees,
  totalRentrees,
  firstName,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  navigate,
  isLoading,
  isError,
  error,
  refetch,
  isFetching,
  rentreesActives,
  rentreesAVenir,
}) => {
  return (
    <div className="space-y-7">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >

        <div>

          <div className="mb-1 flex items-center gap-2">

            <GraduationCap
              className="
                size-5
                text-[#FF6B0B]
              "
            />

            <span
              className="
                text-sm
                font-semibold
                text-[#FF6B0B]
              "
            >
              Espace formateur
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
            Bonjour {firstName} 👋
          </h1>

          <p
            className="
              mt-1
              max-w-2xl
              text-sm
              leading-6
              text-slate-500
              dark:text-slate-400
            "
          >
            Retrouvez les rentrées associées
            à vos formations et à vos cohortes.
          </p>

        </div>

      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {isError && (
        <ErrorMessage
          error={error}
          refetch={refetch}
          isFetching={isFetching}
        />
      )}

      {/* ====================================================
          KPI
      ==================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-3
        "
      >

        <StatCard
          title="Mes rentrées"
          value={totalRentrees}
          subtitle="Rentrées associées"
          icon={Calendar}
        />

        <StatCard
          title="En cours"
          value={rentreesActives}
          subtitle="Formations actives"
          icon={Clock3}
          trend="Actives"
        />

        <StatCard
          title="À venir"
          value={rentreesAVenir}
          subtitle="Formations planifiées"
          icon={Calendar}
        />

      </div>

      {/* ====================================================
          SEARCH / FILTER
      ==================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <SearchBar
          search={search}
          setSearch={setSearch}
          placeholder="Rechercher une rentrée..."
        />

        <StatusSelect
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

      </div>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {isLoading && (
        <TrainerRentreeLoading />
      )}

      {/* ====================================================
          EMPTY
      ==================================================== */}

      {!isLoading &&
        !isError &&
        rentrees.length === 0 && (
          <TrainerRentreeEmpty />
        )}

      {/* ====================================================
          CARDS
      ==================================================== */}

      {!isLoading &&
        !isError &&
        rentrees.length > 0 && (
          <div
            className="
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {rentrees.map(
              (rentree) => (
                <TrainerRentreeCard
                  key={rentree.id}
                  rentree={rentree}
                  navigate={navigate}
                />
              ),
            )}
          </div>
        )}

    </div>
  )
}

// ============================================================
// TRAINER CARD
// ============================================================

interface TrainerRentreeCardProps {
  rentree: Rentree
  navigate: ReturnType<typeof useNavigate>
}

const TrainerRentreeCard: React.FC<
  TrainerRentreeCardProps
> = ({
  rentree,
  navigate,
}) => {
  const isOngoing =
    rentree.status === 'ongoing'

  const isUpcoming =
    rentree.status === 'upcoming'

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

      {/* HEADER */}

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
            -right-10
            -top-12
            size-40
            rounded-full
            bg-white/10
          "
        />

        <div
          className="
            absolute
            -bottom-16
            left-8
            size-32
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
            <Calendar className="size-6" />
          </div>

          <span
            className="
              rounded-full
              bg-white/20
              px-3
              py-1.5
              text-xs
              font-bold
              text-white
              backdrop-blur
            "
          >
            {getStatusLabel(
              rentree.status,
            )}
          </span>

        </div>

      </div>

      {/* CONTENT */}

      <div className="p-5">

        <div className="mb-1">
          <span
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-widest
              text-[#FF6B0B]
            "
          >
            Rentrée académique
          </span>
        </div>

        <h3
          className="
            line-clamp-2
            min-h-[52px]
            text-lg
            font-extrabold
            leading-6
            text-slate-900
            dark:text-white
          "
        >
          {rentree.name ||
            'Rentrée académique'}
        </h3>

        {/* DATE */}

        <div
          className="
            mt-5
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-100
            bg-slate-50
            px-3
            py-3
            dark:border-white/5
            dark:bg-white/[0.04]
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
            <Calendar className="size-4.5" />
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
              Date de début
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
              {rentreeDate(
                rentree.start_date,
              )}
            </p>

          </div>

        </div>

        {/* ETAT */}

        <div
          className="
            mt-3
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-100
            bg-slate-50
            px-3
            py-3
            dark:border-white/5
            dark:bg-white/[0.04]
          "
        >

          <div
            className={`
              flex
              size-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              ${
                isOngoing
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : isUpcoming
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-slate-500/10 text-slate-500'
              }
            `}
          >
            <Clock3 className="size-4.5" />
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
              État de la formation
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
              `/rentrees/${rentree.id}`,
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
            Voir ma rentrée
          </span>

          <ArrowRight
            className="
              size-4
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          />

        </button>

      </div>

    </article>
  )
}

// ============================================================
// TRAINER EMPTY
// ============================================================

const TrainerRentreeEmpty: React.FC = () => {
  return (
    <div
      className="
        flex
        min-h-[360px]
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
        <GraduationCap className="size-8" />
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
        Aucune rentrée associée
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
        Les rentrées associées à vos
        formations et cohortes apparaîtront
        ici dès qu'elles seront disponibles.
      </p>

    </div>
  )
}

// ============================================================
// TRAINER LOADING
// ============================================================

const TrainerRentreeLoading: React.FC = () => {
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
                  w-32
                  animate-pulse
                  rounded
                  bg-slate-200
                  dark:bg-white/10
                "
              />

              <div
                className="
                  h-5
                  w-3/4
                  animate-pulse
                  rounded
                  bg-slate-200
                  dark:bg-white/10
                "
              />

              <div
                className="
                  h-14
                  animate-pulse
                  rounded-2xl
                  bg-slate-100
                  dark:bg-white/5
                "
              />

              <div
                className="
                  h-14
                  animate-pulse
                  rounded-2xl
                  bg-slate-100
                  dark:bg-white/5
                "
              />

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
// LEARNER VIEW
// ============================================================

interface LearnerRentreeViewProps {
  rentrees: Rentree[]
  totalRentrees: number
  firstName: string
  search: string
  setSearch: React.Dispatch<
    React.SetStateAction<string>
  >
  statusFilter: StatusFilter
  setStatusFilter: React.Dispatch<
    React.SetStateAction<StatusFilter>
  >
  navigate: ReturnType<typeof useNavigate>
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  isFetching: boolean
}

const LearnerRentreeView: React.FC<
  LearnerRentreeViewProps
> = ({
  rentrees,
  totalRentrees,
  firstName,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  navigate,
  isLoading,
  isError,
  error,
  refetch,
  isFetching,
}) => {
  return (
    <div className="space-y-7">

      <div>

        <div className="flex items-center gap-2">

          <GraduationCap
            className="
              size-5
              text-[#FF6B0B]
            "
          />

          <span
            className="
              text-sm
              font-semibold
              text-[#FF6B0B]
            "
          >
            Mon parcours
          </span>

        </div>

        <h1
          className="
            mt-1
            text-2xl
            font-extrabold
            tracking-tight
            text-slate-900
            dark:text-white
            sm:text-3xl
          "
        >
          Bonjour {firstName} 👋
        </h1>

        <p
          className="
            mt-1
            max-w-2xl
            text-sm
            leading-6
            text-slate-500
            dark:text-slate-400
          "
        >
          Retrouvez les rentrées associées
          à votre parcours de formation.
        </p>

      </div>

      {isError && (
        <ErrorMessage
          error={error}
          refetch={refetch}
          isFetching={isFetching}
        />
      )}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <h2
            className="
              text-xl
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Mes rentrées
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            {totalRentrees}{' '}
            rentrée
            {totalRentrees > 1
              ? 's'
              : ''}{' '}
            dans votre parcours.
          </p>

        </div>

        <div className="flex gap-2">

          <SearchBar
            search={search}
            setSearch={setSearch}
            placeholder="Rechercher..."
          />

          <StatusSelect
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            compact
          />

        </div>

      </div>

      {isLoading && (
        <LearnerRentreeLoading />
      )}

      {!isLoading &&
        !isError &&
        rentrees.length === 0 && (
          <LearnerRentreeEmpty />
        )}

      {!isLoading &&
        !isError &&
        rentrees.length > 0 && (
          <div
            className="
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {rentrees.map(
              (rentree) => (
                <LearnerRentreeCard
                  key={rentree.id}
                  rentree={rentree}
                  navigate={navigate}
                />
              ),
            )}
          </div>
        )}

    </div>
  )
}

// ============================================================
// LEARNER CARD
// ============================================================

interface LearnerRentreeCardProps {
  rentree: Rentree
  navigate: ReturnType<typeof useNavigate>
}

const LearnerRentreeCard: React.FC<
  LearnerRentreeCardProps
> = ({
  rentree,
  navigate,
}) => {
  const isOngoing =
    rentree.status === 'ongoing'

  const isUpcoming =
    rentree.status === 'upcoming'

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

      <div
        className="
          relative
          h-28
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
            left-10
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
            <Calendar className="size-6" />
          </div>

          <span
            className="
              rounded-full
              bg-white/15
              px-3
              py-1.5
              text-xs
              font-bold
              text-white
              backdrop-blur
            "
          >
            {getStatusLabel(
              rentree.status,
            )}
          </span>

        </div>

      </div>

      <div className="p-5">

        <h3
          className="
            line-clamp-2
            min-h-[52px]
            text-lg
            font-extrabold
            leading-6
            text-slate-900
            dark:text-white
          "
        >
          {rentree.name ||
            'Rentrée académique'}
        </h3>

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
              items-center
              justify-center
              rounded-lg
              bg-[#FF6B0B]/10
              text-[#FF6B0B]
            "
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
              Début de la rentrée
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
              {rentreeDate(
                rentree.start_date,
              )}
            </p>

          </div>

        </div>

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
                ? 'Votre formation est en cours'
                : isUpcoming
                  ? 'Votre formation commence bientôt'
                  : 'Rentrée terminée'}
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/rentrees/${rentree.id}`,
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
            Voir ma rentrée
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
// COMMON SEARCH BAR
// ============================================================

interface SearchBarProps {
  search: string
  setSearch: React.Dispatch<
    React.SetStateAction<string>
  >
  placeholder?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  search,
  setSearch,
  placeholder = 'Rechercher...',
}) => {
  return (
    <div
      className="
        relative
        w-full
        sm:w-64
      "
    >

      <Search
        className="
          pointer-events-none
          absolute
          left-3.5
          top-1/2
          size-4
          -translate-y-1/2
          text-slate-400
        "
      />

      <input
        type="text"
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder={placeholder}
        className="
          h-10
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          pl-10
          pr-4
          text-sm
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-[#FF6B0B]
          focus:ring-1
          focus:ring-[#FF6B0B]
          dark:border-white/10
          dark:bg-[#1f1f38]
          dark:text-white
        "
      />

    </div>
  )
}

// ============================================================
// COMMON STATUS SELECT
// ============================================================

interface StatusSelectProps {
  statusFilter: StatusFilter
  setStatusFilter: React.Dispatch<
    React.SetStateAction<StatusFilter>
  >
  compact?: boolean
}

const StatusSelect: React.FC<
  StatusSelectProps
> = ({
  statusFilter,
  setStatusFilter,
  compact = false,
}) => {
  return (
    <div
      className={`
        relative
        ${compact ? '' : 'min-w-[180px]'}
      `}
    >

      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(
            event.target
              .value as StatusFilter,
          )
        }
        className={`
          h-10
          w-full
          cursor-pointer
          appearance-none
          rounded-xl
          border
          border-slate-200
          bg-white
          pl-3.5
          pr-9
          text-xs
          font-semibold
          text-slate-800
          outline-none
          focus:border-[#FF6B0B]
          focus:ring-1
          focus:ring-[#FF6B0B]
          dark:border-white/10
          dark:bg-[#1f1f38]
          dark:text-slate-200
          ${compact ? 'min-w-[130px]' : ''}
        `}
      >

        <option value="all">
          Tous les statuts
        </option>

        <option value="ongoing">
          En cours
        </option>

        <option value="upcoming">
          À venir
        </option>

        <option value="completed">
          Terminées
        </option>

        <option value="inactive">
          Inactives
        </option>

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
  )
}

// ============================================================
// LEARNER EMPTY
// ============================================================

const LearnerRentreeEmpty: React.FC = () => {
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
        <Calendar className="size-8" />
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
        Aucune rentrée disponible
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
        Les rentrées associées à votre
        parcours apparaîtront ici dès
        qu’elles seront disponibles.
      </p>

    </div>
  )
}

// ============================================================
// LEARNER LOADING
// ============================================================

const LearnerRentreeLoading: React.FC = () => {
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
                h-28
                animate-pulse
                bg-slate-200
                dark:bg-white/10
              "
            />

            <div className="space-y-4 p-5">

              <div
                className="
                  h-5
                  w-3/4
                  animate-pulse
                  rounded
                  bg-slate-200
                  dark:bg-white/10
                "
              />

              <div
                className="
                  h-12
                  animate-pulse
                  rounded-xl
                  bg-slate-100
                  dark:bg-white/5
                "
              />

              <div
                className="
                  h-12
                  animate-pulse
                  rounded-xl
                  bg-slate-100
                  dark:bg-white/5
                "
              />

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
          les rentrées.
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

export default RentreeListPage

