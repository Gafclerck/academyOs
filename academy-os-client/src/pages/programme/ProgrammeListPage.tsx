import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Plus,
  BookOpen,
  CheckCircle2,
  Calendar,
  Users,
  ChevronDown,
  RefreshCw,
  Eye,
  GraduationCap,
  ArrowRight,
  Clock3,
  Search,
  ShieldCheck,
  BriefcaseBusiness,
  Layers3,
} from 'lucide-react'

import {
  useProgrammes,
  useProgrammeKPIs,
} from '../../hooks/useProgrammes'

import type { Programme } from '../../types/programme'

import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/StatusBadge'

import {
  DataTable,
  type ColumnDef,
} from '../../components/ui/DataTable'

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
  | 'actif'
  | 'inactif'

type CardVariant = 'trainer' | 'learner'

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

const getUserFirstName = (user: any) => {
  if (user?.first_name) {
    return user.first_name
  }

  if (user?.full_name) {
    return user.full_name.split(' ')[0]
  }

  if (user?.name) {
    return user.name.split(' ')[0]
  }

  return 'Utilisateur'
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export const ProgrammeListPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [statutFilter, setStatutFilter] =
    useState<StatusFilter>('all')

  const [search, setSearch] = useState('')

  // ============================================================
  // UTILISATEUR CONNECTÉ
  // ============================================================

  const role =
    (user?.role as UserRole | undefined) ?? 'learner'

  const firstName = getUserFirstName(user)

  // ============================================================
  // PROGRAMMES
  // ============================================================

  const {
    data: programmes = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProgrammes()

  // ============================================================
  // KPIs
  // ============================================================

  const {
    data: kpis,
    isLoading: kpisLoading,
  } = useProgrammeKPIs()

  // ============================================================
  // FILTRAGE
  // ============================================================

  const filteredData = useMemo(() => {
    let result = [...programmes]

    if (statutFilter !== 'all') {
      result = result.filter(
        (programme) =>
          programme.statut === statutFilter,
      )
    }

    if (search.trim()) {
      const query =
        search.trim().toLowerCase()

      result = result.filter((programme) => {
        const nom =
          programme.nom?.toLowerCase() ?? ''

        const description =
          programme.description?.toLowerCase() ?? ''

        return (
          nom.includes(query) ||
          description.includes(query)
        )
      })
    }

    return result
  }, [programmes, statutFilter, search])

  // ============================================================
  // VUE FORMATEUR
  // ============================================================

  if (role === 'trainer') {
    return (
      <TrainerProgrammeView
        programmes={filteredData}
        totalProgrammes={programmes.length}
        firstName={firstName}
        search={search}
        setSearch={setSearch}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
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
  // VUE APPRENANT
  // ============================================================

  if (role === 'learner') {
    return (
      <LearnerProgrammeView
        programmes={filteredData}
        programmesCount={programmes.length}
        firstName={firstName}
        search={search}
        setSearch={setSearch}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
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
  // COLONNES ADMIN / ORGANIZER
  // ============================================================

  const columns = useMemo<ColumnDef<Programme>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom du Programme',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10">
              <BookOpen className="size-5 text-[#FF6B0B]" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {row.original.nom || 'Sans nom'}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Programme académique
              </p>
            </div>
          </div>
        ),
      },

      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <p className="line-clamp-2 max-w-md text-xs text-slate-600 dark:text-slate-300">
            {row.original.description ||
              'Aucune description disponible.'}
          </p>
        ),
      },

      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => (
          <StatusBadge status={row.original.statut} />
        ),
      },

      {
        id: 'actions',
        header: () => (
          <div className="pr-2 text-right">Actions</div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/programmes/${row.original.id}`)
              }
              className="h-8 rounded-xl border-[#FF6B0B]/30 px-3 text-xs font-semibold text-[#FF6B0B] hover:border-[#FF6B0B] hover:bg-[#FF6B0B] hover:text-white"
            >
              <Eye className="mr-1.5 size-3.5" />
              Voir détails
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  )

  // ============================================================
  // ADMIN / ORGANIZER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {role === 'admin' ? (
              <ShieldCheck className="size-4 text-[#FF6B0B]" />
            ) : (
              <BriefcaseBusiness className="size-4 text-[#FF6B0B]" />
            )}

            <span className="text-sm font-semibold text-[#FF6B0B]">
              {getRoleLabel(role)}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {role === 'admin'
              ? 'Programmes Académiques'
              : 'Programmes'}
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {role === 'admin'
              ? 'Gérez et supervisez l’ensemble des parcours et formations.'
              : 'Gérez les programmes que vous pilotez.'}
          </p>
        </div>

        <Button
          onClick={() => navigate('/programmes/new')}
          className="h-11 rounded-xl bg-[#FF6B0B] px-5 font-semibold text-white shadow-lg shadow-[#FF6B0B]/25 hover:bg-[#ff7a24]"
        >
          <Plus className="mr-2 size-4" />
          Nouveau Programme
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Programmes"
          value={
            kpisLoading
              ? '...'
              : kpis?.total_programmes ?? programmes.length
          }
          subtitle="Formations enregistrées"
          icon={BookOpen}
        />

        <StatCard
          title="Programmes Actifs"
          value={
            kpisLoading
              ? '...'
              : kpis?.programmes_actifs ??
                programmes.filter((p) => p.statut === 'actif')
                  .length
          }
          subtitle="Actuellement ouverts"
          icon={CheckCircle2}
          trend="Actifs"
        />

        <StatCard
          title="Total Rentrées"
          value={
            kpisLoading ? '...' : kpis?.total_rentrees ?? 0
          }
          subtitle="Promotions organisées"
          icon={Calendar}
        />

        <StatCard
          title="Total Étudiants"
          value={
            kpisLoading ? '...' : kpis?.total_etudiants ?? 0
          }
          subtitle="Apprenants inscrits"
          icon={Users}
        />
      </div>

      {/* RECHERCHE */}
      <ProgrammeFilters
        search={search}
        setSearch={setSearch}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
      />

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Rechercher un programme..."
        emptyMessage={
          isError
            ? 'Impossible de charger les programmes.'
            : 'Aucun programme trouvé.'
        }
      />
    </div>
  )
}

// ============================================================
// FORMATEUR VIEW
// ============================================================

interface TrainerProgrammeViewProps {
  programmes: Programme[]
  totalProgrammes: number
  firstName: string
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  statutFilter: StatusFilter
  setStatutFilter: React.Dispatch<
    React.SetStateAction<StatusFilter>
  >
  navigate: ReturnType<typeof useNavigate>
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  isFetching: boolean
}

const TrainerProgrammeView: React.FC<TrainerProgrammeViewProps> = ({
  programmes,
  totalProgrammes,
  firstName,
  search,
  setSearch,
  statutFilter,
  setStatutFilter,
  navigate,
  isLoading,
  isError,
  error,
  refetch,
  isFetching,
}) => {
  const activeCount = programmes.filter(
    (programme) => programme.statut === 'actif',
  ).length

  return (
    <div className="space-y-7">
      {/* HEADER FORMATEUR */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#FF6B0B]/10 px-3 py-1.5 text-xs font-bold text-[#FF6B0B]">
            <GraduationCap className="size-3.5" />
            Espace formateur
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Mes programmes
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Bonjour {firstName}, retrouvez les programmes et
            parcours dans lesquels vous intervenez.
          </p>
        </div>

        {/* PETIT RESUME */}
        <div className="flex items-center gap-3">
          <SummaryPill
            icon={Layers3}
            iconClassName="bg-[#FF6B0B]/10 text-[#FF6B0B]"
            value={totalProgrammes}
            label={`Programme${totalProgrammes > 1 ? 's' : ''}`}
          />

          <SummaryPill
            icon={CheckCircle2}
            iconClassName="bg-emerald-500/10 text-emerald-500"
            value={activeCount}
            label={`Actif${activeCount > 1 ? 's' : ''}`}
            className="hidden sm:flex"
          />
        </div>
      </div>

      {isError && (
        <ErrorMessage
          error={error}
          refetch={refetch}
          isFetching={isFetching}
        />
      )}

      {/* FILTRES */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Vos formations
          </h2>

          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Accédez rapidement à vos programmes et cohortes.
          </p>
        </div>

        <ProgrammeFilters
          search={search}
          setSearch={setSearch}
          statutFilter={statutFilter}
          setStatutFilter={setStatutFilter}
          compact
        />
      </div>

      {isLoading && <ProgrammeCardsLoading />}

      {!isLoading && !isError && programmes.length === 0 && (
        <ProgrammeEmptyState variant="trainer" />
      )}

      {!isLoading && !isError && programmes.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {programmes.map((programme) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              navigate={navigate}
              variant="trainer"
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// LEARNER VIEW
// ============================================================

interface LearnerProgrammeViewProps {
  programmes: Programme[]
  programmesCount: number
  firstName: string
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  statutFilter: StatusFilter
  setStatutFilter: React.Dispatch<
    React.SetStateAction<StatusFilter>
  >
  navigate: ReturnType<typeof useNavigate>
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  isFetching: boolean
}

const LearnerProgrammeView: React.FC<LearnerProgrammeViewProps> = ({
  programmes,
  firstName,
  search,
  setSearch,
  statutFilter,
  setStatutFilter,
  navigate,
  isLoading,
  isError,
  error,
  refetch,
  isFetching,
}) => {
  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#FF6B0B]/10 px-3 py-1.5 text-xs font-bold text-[#FF6B0B]">
          <GraduationCap className="size-3.5" />
          Mon espace formation
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Bonjour, {firstName} 👋
        </h1>

        <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Retrouvez les programmes auxquels vous êtes inscrit.
        </p>
      </div>

      {isError && (
        <ErrorMessage
          error={error}
          refetch={refetch}
          isFetching={isFetching}
        />
      )}

      <ProgrammeFilters
        search={search}
        setSearch={setSearch}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
      />

      {isLoading && <ProgrammeCardsLoading />}

      {!isLoading && !isError && programmes.length === 0 && (
        <ProgrammeEmptyState variant="learner" />
      )}

      {!isLoading && !isError && programmes.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {programmes.map((programme) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              navigate={navigate}
              variant="learner"
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// SUMMARY PILL (trainer header stat)
// ============================================================

interface SummaryPillProps {
  icon: React.ComponentType<{ className?: string }>
  iconClassName: string
  value: number
  label: string
  className?: string
}

const SummaryPill: React.FC<SummaryPillProps> = ({
  icon: Icon,
  iconClassName,
  value,
  label,
  className = '',
}) => (
  <div
    className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] ${className}`}
  >
    <div
      className={`flex size-10 items-center justify-center rounded-xl ${iconClassName}`}
    >
      <Icon className="size-5" />
    </div>

    <div>
      <p className="text-lg font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  </div>
)

// ============================================================
// PROGRAMME CARD (shared trainer/learner)
// ============================================================

const CARD_VARIANT_CONFIG: Record<
  CardVariant,
  {
    badgeActive: string
    badgeInactive: string
    infoRows: {
      icon: React.ComponentType<{ className?: string }>
      iconClassName: string
      label: string
      valueActive: string
      valueInactive?: string
    }[]
    ctaLabel: string
    topGradient: string
  }
> = {
  trainer: {
    badgeActive: 'Programme actif',
    badgeInactive: 'Inactif',
    topGradient:
      'from-slate-900 via-slate-800 to-[#FF6B0B]',
    infoRows: [
      {
        icon: Layers3,
        iconClassName: 'bg-[#FF6B0B]/10 text-[#FF6B0B]',
        label: 'Rôle',
        valueActive: 'Formateur',
      },
      {
        icon: Users,
        iconClassName: 'bg-blue-500/10 text-blue-500',
        label: 'Gestion',
        valueActive: 'Cohortes et apprenants',
      },
    ],
    ctaLabel: 'Voir mes cohortes',
  },
  learner: {
    badgeActive: 'En cours',
    badgeInactive: 'Inactif',
    topGradient:
      'from-orange-500 via-[#FF6B0B] to-orange-300',
    infoRows: [
      {
        icon: GraduationCap,
        iconClassName: 'bg-[#FF6B0B]/10 text-[#FF6B0B]',
        label: 'Parcours',
        valueActive: 'Votre formation',
      },
      {
        icon: Clock3,
        iconClassName: 'bg-blue-500/10 text-blue-500',
        label: 'Statut',
        valueActive: 'Formation en cours',
        valueInactive: 'Formation inactive',
      },
    ],
    ctaLabel: 'Voir mon parcours',
  },
}

interface ProgrammeCardProps {
  programme: Programme
  navigate: ReturnType<typeof useNavigate>
  variant: CardVariant
}

const ProgrammeCard: React.FC<ProgrammeCardProps> = ({
  programme,
  navigate,
  variant,
}) => {
  const isActive = programme.statut === 'actif'
  const config = CARD_VARIANT_CONFIG[variant]

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04]">
      {/* TOP */}
      <div
        className={`relative overflow-hidden bg-gradient-to-br p-5 ${
          variant === 'trainer' ? 'h-auto' : 'h-28'
        } ${config.topGradient}`}
      >
        {variant === 'trainer' && (
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/10" />
        )}

        <div
          className={`relative z-10 flex items-center justify-between gap-3 ${
            variant === 'learner' ? 'h-full px-0' : ''
          }`}
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
            <BookOpen className="size-6" />
          </div>

          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
            {isActive ? config.badgeActive : config.badgeInactive}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <h3 className="line-clamp-2 text-lg font-extrabold leading-6 text-slate-900 dark:text-white">
          {programme.nom || 'Programme sans nom'}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500 dark:text-slate-400">
          {programme.description ||
            'Aucune description disponible.'}
        </p>

        {/* INFOS */}
        <div className="mt-5 space-y-2">
          {config.infoRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]"
            >
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${row.iconClassName}`}
              >
                <row.icon className="size-4" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {row.label}
                </p>

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isActive
                    ? row.valueActive
                    : row.valueInactive ?? row.valueActive}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ACTION */}
        <button
          type="button"
          onClick={() => navigate(`/programmes/${programme.id}`)}
          className="mt-5 flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#FF6B0B] dark:bg-white dark:text-slate-900 dark:hover:bg-[#FF6B0B] dark:hover:text-white"
        >
          <span>{config.ctaLabel}</span>

          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  )
}

// ============================================================
// EMPTY STATE (shared trainer/learner)
// ============================================================

const EMPTY_STATE_CONFIG: Record<
  CardVariant,
  { title: string; description: string }
> = {
  trainer: {
    title: 'Aucun programme assigné',
    description:
      "Vous n'êtes actuellement associé à aucun programme. Les programmes dans lesquels vous intervenez apparaîtront automatiquement ici.",
  },
  learner: {
    title: 'Aucun programme pour le moment',
    description:
      'Vous n’êtes actuellement inscrit à aucun programme.',
  },
}

const ProgrammeEmptyState: React.FC<{ variant: CardVariant }> = ({
  variant,
}) => {
  const config = EMPTY_STATE_CONFIG[variant]

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
        <GraduationCap className="size-8" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
        {config.title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {config.description}
      </p>
    </div>
  )
}

// ============================================================
// CARDS LOADING SKELETON (shared trainer/learner)
// ============================================================

const ProgrammeCardsLoading: React.FC = () => {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="h-28 animate-pulse bg-slate-200 dark:bg-white/10" />

          <div className="space-y-4 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-10 animate-pulse rounded bg-slate-100 dark:bg-white/5" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// FILTERS
// ============================================================

interface ProgrammeFiltersProps {
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  statutFilter: StatusFilter
  setStatutFilter: React.Dispatch<
    React.SetStateAction<StatusFilter>
  >
  compact?: boolean
}

const ProgrammeFilters: React.FC<ProgrammeFiltersProps> = ({
  search,
  setSearch,
  statutFilter,
  setStatutFilter,
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
        compact ? 'sm:justify-end' : 'sm:justify-between'
      }`}
    >
      <div
        className={`relative w-full ${
          compact ? 'sm:w-64' : 'sm:max-w-md'
        }`}
      >
        <label htmlFor="programme-search" className="sr-only">
          Rechercher un programme
        </label>

        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

        <input
          id="programme-search"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un programme..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#FF6B0B] focus:ring-1 focus:ring-[#FF6B0B] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        />
      </div>

      <div
        className={`relative ${
          compact ? 'min-w-[150px]' : 'min-w-[160px]'
        }`}
      >
        <label htmlFor="programme-status-filter" className="sr-only">
          Filtrer par statut
        </label>

        <select
          id="programme-status-filter"
          value={statutFilter}
          onChange={(event) =>
            setStatutFilter(event.target.value as StatusFilter)
          }
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-700 outline-none focus:border-[#FF6B0B] dark:border-white/10 dark:bg-[#1f1f38] dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>
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

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  refetch,
  isFetching,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/20 dark:bg-red-500/10">
      <div>
        <p className="font-semibold text-red-700 dark:text-red-400">
          Impossible de récupérer les programmes.
        </p>

        <p className="mt-1 text-xs text-red-600 dark:text-red-300">
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
          className={`mr-2 size-4 ${
            isFetching ? 'animate-spin' : ''
          }`}
        />
        Réessayer
      </Button>
    </div>
  )
}

export default ProgrammeListPage