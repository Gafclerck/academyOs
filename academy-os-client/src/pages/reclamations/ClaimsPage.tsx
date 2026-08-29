import React, { useEffect, useMemo, useState } from 'react'
import API from '@/api/api'
import { useAuth } from '@/context/AuthContext'
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  UserCog,
  X,
  XCircle,
  ArrowRight,
  Send,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

export type ClaimStatus =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'rejected'

export type UserRole =
  | 'admin'
  | 'organizer'
  | string

export interface Claim {
  id: string

  certificate: string
  certificate_id_display: string

  learner: string
  learner_email: string
  learner_name: string

  program_title: string
  cohort_name: string

  message: string

  status: ClaimStatus

  admin_response: string

  handled_by: string | null
  handled_by_email: string | null
  handled_at: string | null

  created_at: string
  updated_at: string
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Claim[]
}

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG: Record<
  ClaimStatus,
  {
    label: string
    className: string
    icon: React.ComponentType<{
      className?: string
    }>
  }
> = {
  pending: {
    label: 'En attente',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: Clock,
  },

  in_progress: {
    label: 'En cours',
    className:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    icon: Loader2,
  },

  resolved: {
    label: 'Résolue',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
  },

  rejected: {
    label: 'Rejetée',
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400',
    icon: XCircle,
  },
}

// ============================================================
// HELPERS
// ============================================================

const formatDate = (value: string | null) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateTime = (value: string | null) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================
// MAIN PAGE
// ============================================================

const ClaimsPage: React.FC = () => {
  const { user } = useAuth()

  const [claims, setClaims] = useState<Claim[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [statusFilter, setStatusFilter] =
    useState<ClaimStatus | 'all'>('all')

  const [search, setSearch] = useState('')

  const [count, setCount] = useState(0)

  const [nextPage, setNextPage] =
    useState<string | null>(null)

  const [previousPage, setPreviousPage] =
    useState<string | null>(null)

  const [page, setPage] = useState(1)

  const [selectedClaim, setSelectedClaim] =
    useState<Claim | null>(null)

  // ==========================================================
  // PERMISSIONS
  //
  // On lit le rôle depuis le AuthContext (comme le reste de
  // l'app) plutôt que depuis localStorage/sessionStorage
  // directement, pour rester cohérent avec la source de vérité
  // de l'authentification.
  // ==========================================================

  const role = (user?.role as UserRole | undefined) ?? null

  const isAdmin = role === 'admin'

  const isOrganisateur = role === 'organizer'

  const canManageClaims =
    isAdmin || isOrganisateur

  // ==========================================================
  // LOAD CLAIMS
  // ==========================================================

  const loadClaims = async (
    requestedPage = page,
    requestedStatus = statusFilter,
  ) => {
    setLoading(true)
    setError(null)

    try {
      const params: Record<
        string,
        string | number
      > = {
        page: requestedPage,
        page_size: 10,
      }

      if (requestedStatus !== 'all') {
        params.status = requestedStatus
      }

      const response =
        await API.get<PaginatedResponse>(
          '/claims/',
          {
            params,
          },
        )

      const data = response.data

      setClaims(
        Array.isArray(data?.results)
          ? data.results
          : [],
      )

      setCount(
        typeof data?.count === 'number'
          ? data.count
          : 0,
      )

      setNextPage(data?.next ?? null)
      setPreviousPage(data?.previous ?? null)
      setPage(requestedPage)
    } catch (err: any) {
      console.error(
        'Erreur lors du chargement des réclamations :',
        err,
      )

      const status =
        err?.response?.status

      if (status === 401) {
        setError(
          'Votre session a expiré. Veuillez vous reconnecter.',
        )
      } else if (status === 403) {
        setError(
          "Vous n'avez pas les permissions nécessaires pour consulter les réclamations.",
        )
      } else {
        setError(
          'Impossible de charger les réclamations.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadClaims(1, statusFilter)
  }, [statusFilter])

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredClaims = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    if (!query) {
      return claims
    }

    return claims.filter((claim) => {
      return (
        claim.learner_name
          ?.toLowerCase()
          .includes(query) ||
        claim.learner_email
          ?.toLowerCase()
          .includes(query) ||
        claim.program_title
          ?.toLowerCase()
          .includes(query) ||
        claim.cohort_name
          ?.toLowerCase()
          .includes(query) ||
        claim.certificate_id_display
          ?.toLowerCase()
          .includes(query)
      )
    })
  }, [claims, search])

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const handleNextPage = () => {
    if (!nextPage) return

    void loadClaims(
      page + 1,
      statusFilter,
    )
  }

  const handlePreviousPage = () => {
    if (!previousPage || page <= 1) {
      return
    }

    void loadClaims(
      page - 1,
      statusFilter,
    )
  }

  // ==========================================================
  // UPDATE CLAIM IN LIST
  // ==========================================================

  const handleClaimUpdated = (
    updatedClaim: Claim,
  ) => {
    setClaims((current) =>
      current.map((claim) =>
        claim.id === updatedClaim.id
          ? updatedClaim
          : claim,
      ),
    )

    setSelectedClaim(updatedClaim)
  }

  // ==========================================================
  // KPI
  // ==========================================================

  const pendingCount =
    claims.filter(
      (claim) =>
        claim.status === 'pending',
    ).length

  const inProgressCount =
    claims.filter(
      (claim) =>
        claim.status === 'in_progress',
    ).length

  const resolvedCount =
    claims.filter(
      (claim) =>
        claim.status === 'resolved',
    ).length

  const rejectedCount =
    claims.filter(
      (claim) =>
        claim.status === 'rejected',
    ).length

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>

          <div className="mb-2 flex items-center gap-2">

            <p className="text-sm font-medium text-[#FF6B0B]">
              Gestion des certificats
            </p>

            {isAdmin && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-purple-500/10
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  text-purple-600
                  dark:text-purple-400
                "
              >
                <ShieldCheck className="size-3" />
                Administration
              </span>
            )}

            {isOrganisateur && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-blue-500/10
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  text-blue-600
                  dark:text-blue-400
                "
              >
                <UserCog className="size-3" />
                Organisation
              </span>
            )}

          </div>

          <h1
            className="
              text-2xl
              font-extrabold
              text-slate-900
              dark:text-white
            "
          >
            Réclamations
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            {isAdmin
              ? 'Gérez les réclamations de certificats de toute la plateforme.'
              : isOrganisateur
                ? 'Gérez les réclamations liées à vos programmes et cohortes.'
                : 'Consultez les réclamations de certificats.'}
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            loadClaims(
              page,
              statusFilter,
            )
          }
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            self-start
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-700
            shadow-sm
            transition-all
            hover:border-[#FF6B0B]/30
            hover:text-[#FF6B0B]
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-white/10
            dark:bg-[#1f1f38]
            dark:text-slate-200
          "
        >
          <RefreshCw
            className={`size-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          Actualiser
        </button>

      </div>

      {/* ORGANISATEUR INFO */}

      {isOrganisateur && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-4
            dark:border-blue-500/20
            dark:bg-blue-500/10
          "
        >
          <UserCog
            className="
              mt-0.5
              size-5
              shrink-0
              text-blue-500
            "
          />

          <div>
            <p
              className="
                text-sm
                font-semibold
                text-blue-800
                dark:text-blue-300
              "
            >
              Espace Organisateur
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-blue-700
                dark:text-blue-400
              "
            >
              Vous consultez et traitez uniquement
              les réclamations accessibles selon vos
              programmes et cohortes.
            </p>
          </div>
        </div>
      )}

      {/* KPI */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <StatCard
          title="En attente"
          value={pendingCount}
          icon={Clock}
          className="text-amber-500"
        />

        <StatCard
          title="En cours"
          value={inProgressCount}
          icon={Loader2}
          className="text-blue-500"
        />

        <StatCard
          title="Résolues"
          value={resolvedCount}
          icon={CheckCircle2}
          className="text-emerald-500"
        />

        <StatCard
          title="Rejetées"
          value={rejectedCount}
          icon={XCircle}
          className="text-red-500"
        />
      </div>

      {/* FILTERS */}

      <div
        className="
          flex
          flex-col
          gap-3
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm
          md:flex-row
          md:items-center
          dark:border-white/10
          dark:bg-[#1f1f38]
        "
      >

        <div className="relative flex-1">

          <Search
            className="
              absolute
              left-3
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
              setSearch(
                event.target.value,
              )
            }
            placeholder="Rechercher un apprenant, programme..."
            className="
              h-10
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              pl-10
              pr-4
              text-sm
              text-slate-900
              outline-none
              transition
              focus:border-[#FF6B0B]/50
              focus:ring-4
              focus:ring-[#FF6B0B]/10
              dark:border-white/10
              dark:bg-white/5
              dark:text-white
              dark:placeholder:text-slate-500
            "
          />

        </div>

        <div className="relative">

          <Filter
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
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | ClaimStatus
                  | 'all',
              )
            }
            className="
              h-10
              min-w-[190px]
              appearance-none
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              pl-10
              pr-8
              text-sm
              text-slate-700
              outline-none
              focus:border-[#FF6B0B]/50
              focus:ring-4
              focus:ring-[#FF6B0B]/10
              dark:border-white/10
              dark:bg-white/5
              dark:text-white
            "
          >
            <option value="all">
              Tous les statuts
            </option>

            <option value="pending">
              En attente
            </option>

            <option value="in_progress">
              En cours
            </option>

            <option value="resolved">
              Résolues
            </option>

            <option value="rejected">
              Rejetées
            </option>
          </select>

        </div>

      </div>

      {/* ERROR */}

      {error && (
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

          <div className="flex-1">

            <p
              className="
                text-sm
                font-medium
                text-red-700
                dark:text-red-300
              "
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadClaims(
                  page,
                  statusFilter,
                )
              }
              className="
                mt-2
                text-xs
                font-semibold
                text-red-600
                underline
                dark:text-red-400
              "
            >
              Réessayer
            </button>

          </div>
        </div>
      )}

      {/* CONTENT */}

      {loading ? (

        <div
          className="
            flex
            h-64
            items-center
            justify-center
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
            <Loader2
              className="
                size-8
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
              Chargement des réclamations...
            </p>
          </div>
        </div>

      ) : filteredClaims.length === 0 ? (

        <div
          className="
            flex
            min-h-[320px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-8
            text-center
            shadow-sm
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >
          <div
            className="
              flex
              size-14
              items-center
              justify-center
              rounded-2xl
              bg-slate-100
              text-slate-400
              dark:bg-white/5
            "
          >
            <MessageSquare className="size-7" />
          </div>

          <h3
            className="
              mt-4
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Aucune réclamation
          </h3>

          <p
            className="
              mt-1
              max-w-md
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Aucune réclamation ne correspond
            aux critères sélectionnés.
          </p>
        </div>

      ) : (

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>
                <tr
                  className="
                    border-b
                    border-slate-200
                    bg-slate-50/80
                    dark:border-white/10
                    dark:bg-white/[0.02]
                  "
                >
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Apprenant
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Formation
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Certificat
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Statut
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                  dark:divide-white/5
                "
              >

                {filteredClaims.map(
                  (claim) => {
                    const config =
                      STATUS_CONFIG[
                        claim.status
                      ]

                    const StatusIcon =
                      config.icon

                    return (
                      <tr
                        key={claim.id}
                        className="
                          transition-colors
                          hover:bg-slate-50/70
                          dark:hover:bg-white/[0.02]
                        "
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

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
                              <User className="size-5" />
                            </div>

                            <div className="min-w-0">

                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-slate-900
                                  dark:text-white
                                "
                              >
                                {claim.learner_name ||
                                  '—'}
                              </p>

                              <p
                                className="
                                  truncate
                                  text-xs
                                  text-slate-500
                                  dark:text-slate-400
                                "
                              >
                                {claim.learner_email ||
                                  '—'}
                              </p>

                            </div>

                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <div className="max-w-[220px]">

                            <p
                              className="
                                truncate
                                text-sm
                                font-medium
                                text-slate-900
                                dark:text-white
                              "
                            >
                              {claim.program_title ||
                                '—'}
                            </p>

                            <p
                              className="
                                mt-1
                                flex
                                items-center
                                gap-1
                                text-xs
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              <GraduationCap className="size-3.5" />

                              {claim.cohort_name ||
                                '—'}
                            </p>

                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <Briefcase className="size-4 text-slate-400" />

                            <span
                              className="
                                text-sm
                                text-slate-600
                                dark:text-slate-300
                              "
                            >
                              {claim.certificate_id_display ||
                                '—'}
                            </span>

                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              ${config.className}
                            `}
                          >
                            <StatusIcon
                              className={`
                                size-3.5
                                ${
                                  claim.status ===
                                  'in_progress'
                                    ? 'animate-spin'
                                    : ''
                                }
                              `}
                            />

                            {config.label}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <div
                            className="
                              flex
                              items-center
                              gap-1.5
                              text-sm
                              text-slate-500
                              dark:text-slate-400
                            "
                          >
                            <CalendarDays className="size-3.5" />

                            {formatDate(
                              claim.created_at,
                            )}
                          </div>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedClaim(
                                claim,
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-slate-700
                              transition-all
                              hover:border-[#FF6B0B]/30
                              hover:text-[#FF6B0B]
                              dark:border-white/10
                              dark:bg-white/5
                              dark:text-slate-200
                            "
                          >
                            <Eye className="size-3.5" />

                            Voir détail
                          </button>

                        </td>

                      </tr>
                    )
                  },
                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          <div
            className="
              flex
              flex-col
              gap-3
              border-t
              border-slate-200
              px-5
              py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
              dark:border-white/10
            "
          >

            <p
              className="
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              {count} réclamation
              {count > 1 ? 's' : ''} au total
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={
                  !previousPage ||
                  page <= 1
                }
                onClick={
                  handlePreviousPage
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-slate-600
                  transition
                  hover:border-[#FF6B0B]/30
                  hover:text-[#FF6B0B]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-white/10
                  dark:text-slate-300
                "
              >
                Précédent
              </button>

              <span
                className="
                  rounded-xl
                  bg-[#FF6B0B]/10
                  px-3
                  py-2
                  text-xs
                  font-bold
                  text-[#FF6B0B]
                "
              >
                Page {page}
              </span>

              <button
                type="button"
                disabled={!nextPage}
                onClick={handleNextPage}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-slate-600
                  transition
                  hover:border-[#FF6B0B]/30
                  hover:text-[#FF6B0B]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-white/10
                  dark:text-slate-300
                "
              >
                Suivant
              </button>

            </div>

          </div>

        </div>
      )}

      {/* DETAIL MODAL */}

      {selectedClaim && (
        <ClaimModal
          claim={selectedClaim}
          canManage={canManageClaims}
          onClose={() =>
            setSelectedClaim(null)
          }
          onUpdated={
            handleClaimUpdated
          }
        />
      )}

    </div>
  )
}

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{
    className?: string
  }>
  className: string
}

const StatCard: React.FC<
  StatCardProps
> = ({
  title,
  value,
  icon: Icon,
  className,
}) => {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-slate-200/80
        bg-white
        p-5
        shadow-sm
        transition-shadow
        hover:shadow-md
        dark:border-white/10
        dark:bg-[#1f1f38]
      "
    >

      <div
        className={`
          flex
          size-10
          items-center
          justify-center
          rounded-xl
          bg-current/10
          ${className}
        `}
      >
        <Icon className="size-5" />
      </div>

      <p
        className="
          mt-4
          text-xs
          font-semibold
          uppercase
          tracking-wider
          text-slate-500
          dark:text-slate-400
        "
      >
        {title}
      </p>

      <p
        className="
          mt-2
          text-2xl
          font-extrabold
          text-slate-900
          dark:text-white
        "
      >
        {value}
      </p>

    </div>
  )
}

// ============================================================
// CLAIM MODAL
// ============================================================

interface ClaimModalProps {
  claim: Claim
  canManage: boolean
  onClose: () => void
  onUpdated: (claim: Claim) => void
}

const ClaimModal: React.FC<
  ClaimModalProps
> = ({
  claim,
  canManage,
  onClose,
  onUpdated,
}) => {
  const [status, setStatus] =
    useState<ClaimStatus>(
      claim.status,
    )

  const [adminResponse, setAdminResponse] =
    useState(
      claim.admin_response || '',
    )

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  // ==========================================================
  // DETECT CHANGES
  // ==========================================================

  const hasChanges =
    status !== claim.status ||
    adminResponse.trim() !==
      (claim.admin_response || '').trim()

  // ==========================================================
  // RESPONSE REQUIRED
  // ==========================================================

  const responseRequired =
    status === 'resolved' ||
    status === 'rejected'

  const responseMissing =
    responseRequired &&
    !adminResponse.trim()

  // ==========================================================
  // STATUS TRANSITION
  // ==========================================================

  const handleStatusChange = (
    newStatus: ClaimStatus,
  ) => {
    setError(null)

    setStatus(newStatus)

    /*
     * Lorsqu'un administrateur prend une réclamation
     * en charge, le statut passe à "in_progress".
     */
  }

  // ==========================================================
  // QUICK ACTION
  // ==========================================================

  const handleTakeCharge = () => {
    if (!canManage || saving) {
      return
    }

    setError(null)
    setStatus('in_progress')
  }

  const handleResolve = () => {
    if (!canManage || saving) {
      return
    }

    setError(null)
    setStatus('resolved')
  }

  const handleReject = () => {
    if (!canManage || saving) {
      return
    }

    setError(null)
    setStatus('rejected')
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = async () => {
    if (!canManage || saving) {
      return
    }

    const trimmedResponse =
      adminResponse.trim()

    if (
      responseRequired &&
      !trimmedResponse
    ) {
      setError(
        status === 'resolved'
          ? 'Une réponse est obligatoire avant de résoudre la réclamation.'
          : 'Une réponse est obligatoire avant de rejeter la réclamation.',
      )

      return
    }

    if (!hasChanges) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response =
        await API.patch<Claim>(
          `/claims/${claim.id}/`,
          {
            status,
            admin_response:
              trimmedResponse,
          },
        )

      onUpdated(response.data)
    } catch (err: any) {
      console.error(
        'Erreur lors de la mise à jour de la réclamation :',
        err,
      )

      const responseData =
        err?.response?.data

      setError(
        responseData?.detail ||
          responseData?.status?.[0] ||
          responseData?.admin_response?.[0] ||
          'Impossible de mettre à jour la réclamation.',
      )
    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = () => {
    if (saving) {
      return
    }

    if (hasChanges) {
      const confirmed =
        window.confirm(
          'Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer ?',
        )

      if (!confirmed) {
        return
      }
    }

    onClose()
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  const statusConfig =
    STATUS_CONFIG[status]

  const StatusIcon =
    statusConfig.icon

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose()
        }
      }}
    >

      <div
        className="
          max-h-[92vh]
          w-full
          max-w-3xl
          overflow-y-auto
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          dark:border-white/10
          dark:bg-[#1f1f38]
        "
      >

        {/* HEADER */}

        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            bg-white
            px-6
            py-5
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >

          <div>

            <div className="flex items-center gap-2">

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-[#FF6B0B]
                "
              >
                Réclamation de certificat
              </p>

              <span
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  ${statusConfig.className}
                `}
              >

                <StatusIcon
                  className={`
                    size-3
                    ${
                      status ===
                      'in_progress'
                        ? 'animate-spin'
                        : ''
                    }
                  `}
                />

                {statusConfig.label}

              </span>

            </div>

            <h2
              className="
                mt-1
                text-xl
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Détails de la réclamation
            </h2>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="
              flex
              size-9
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:opacity-50
              dark:hover:bg-white/5
              dark:hover:text-white
            "
          >
            <X className="size-5" />
          </button>

        </div>

        {/* CONTENT */}

        <div className="space-y-6 p-6">

          {/* APPRENANT */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-5
              dark:border-white/10
              dark:bg-white/5
            "
          >

            <div className="flex items-start gap-4">

              <div
                className="
                  flex
                  size-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#FF6B0B]/10
                  text-[#FF6B0B]
                "
              >
                <User className="size-6" />
              </div>

              <div className="min-w-0 flex-1">

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Apprenant
                </p>

                <p
                  className="
                    mt-1
                    text-lg
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {claim.learner_name ||
                    '—'}
                </p>

                <div
                  className="
                    mt-1
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  <Mail className="size-3.5" />

                  {claim.learner_email ||
                    '—'}
                </div>

              </div>

            </div>

          </div>

          {/* INFORMATIONS CERTIFICAT */}

          <div>

            <div
              className="
                mb-3
                flex
                items-center
                gap-2
              "
            >

              <div
                className="
                  flex
                  size-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#FF6B0B]/10
                  text-[#FF6B0B]
                "
              >
                <Briefcase className="size-4" />
              </div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Informations du certificat
              </h3>

            </div>

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >

              <DetailItem
                icon={Briefcase}
                label="Programme"
                value={
                  claim.program_title
                }
              />

              <DetailItem
                icon={GraduationCap}
                label="Cohorte"
                value={
                  claim.cohort_name
                }
              />

              <DetailItem
                icon={ShieldCheck}
                label="Certificat"
                value={
                  claim.certificate_id_display
                }
              />

              <DetailItem
                icon={CalendarDays}
                label="Date de réclamation"
                value={formatDateTime(
                  claim.created_at,
                )}
              />

            </div>

          </div>

          {/* MESSAGE APPRENANT */}

          <div>

            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-slate-900
                dark:text-white
              "
            >
              Motif de la réclamation
            </label>

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-5
                text-sm
                leading-6
                text-slate-600
                dark:border-white/10
                dark:bg-white/5
                dark:text-slate-300
              "
            >
              {claim.message ||
                'Aucun message fourni par l’apprenant.'}
            </div>

          </div>

          {/* TRAITEMENT */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              p-5
              dark:border-white/10
            "
          >

            <div
              className="
                mb-5
                flex
                items-center
                gap-2
              "
            >

              <div
                className="
                  flex
                  size-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-blue-500/10
                  text-blue-500
                "
              >
                <ShieldCheck className="size-4" />
              </div>

              <div>

                <h3
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Traitement de la réclamation
                </h3>

                <p
                  className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {canManage
                    ? 'Traitez la demande, rédigez une réponse puis clôturez-la.'
                    : 'Informations relatives au traitement.'}
                </p>

              </div>

            </div>

            {/* QUICK ACTIONS */}

            {canManage && (
              <div className="mb-5">

                <p
                  className="
                    mb-2
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Actions rapides
                </p>

                <div className="flex flex-wrap gap-2">

                  {status !== 'in_progress' &&
                    status !== 'resolved' &&
                    status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={
                          handleTakeCharge
                        }
                        disabled={saving}
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          border
                          border-blue-200
                          bg-blue-50
                          px-3
                          py-2
                          text-xs
                          font-semibold
                          text-blue-700
                          transition
                          hover:bg-blue-100
                          disabled:opacity-50
                          dark:border-blue-500/20
                          dark:bg-blue-500/10
                          dark:text-blue-300
                        "
                      >
                        <ArrowRight className="size-3.5" />

                        Prendre en charge
                      </button>
                    )}

                  {status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={handleResolve}
                      disabled={saving}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-emerald-200
                        bg-emerald-50
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        text-emerald-700
                        transition
                        hover:bg-emerald-100
                        disabled:opacity-50
                        dark:border-emerald-500/20
                        dark:bg-emerald-500/10
                        dark:text-emerald-300
                      "
                    >
                      <CheckCircle2 className="size-3.5" />

                      Résoudre
                    </button>
                  )}

                  {status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={saving}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        text-red-700
                        transition
                        hover:bg-red-100
                        disabled:opacity-50
                        dark:border-red-500/20
                        dark:bg-red-500/10
                        dark:text-red-300
                      "
                    >
                      <XCircle className="size-3.5" />

                      Rejeter
                    </button>
                  )}

                </div>

              </div>
            )}

            {/* STATUS */}

            <div>

              <label
                htmlFor="claim-status"
                className="
                  mb-2
                  block
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Statut
              </label>

              {canManage ? (

                <select
                  id="claim-status"
                  value={status}
                  onChange={(event) =>
                    handleStatusChange(
                      event.target
                        .value as ClaimStatus,
                    )
                  }
                  disabled={saving}
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    text-sm
                    font-medium
                    text-slate-900
                    outline-none
                    transition
                    focus:border-[#FF6B0B]/50
                    focus:ring-4
                    focus:ring-[#FF6B0B]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:border-white/10
                    dark:bg-white/5
                    dark:text-white
                  "
                >

                  <option value="pending">
                    En attente
                  </option>

                  <option value="in_progress">
                    En cours
                  </option>

                  <option value="resolved">
                    Résolue
                  </option>

                  <option value="rejected">
                    Rejetée
                  </option>

                </select>

              ) : (

                <div
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:border-white/10
                    dark:bg-white/5
                    dark:text-slate-300
                  "
                >
                  {STATUS_CONFIG[
                    claim.status
                  ].label}
                </div>

              )}

            </div>

            {/* RESPONSE */}

            <div className="mt-5">

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="admin-response"
                  className="
                    block
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Réponse à l'apprenant
                </label>

                {responseRequired && (
                  <span
                    className="
                      text-[11px]
                      font-semibold
                      text-red-500
                    "
                  >
                    Obligatoire
                  </span>
                )}

              </div>

              {canManage ? (

                <textarea
                  id="admin-response"
                  value={adminResponse}
                  onChange={(event) =>
                    setAdminResponse(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                  rows={6}
                  placeholder={
                    status === 'rejected'
                      ? 'Expliquez clairement à l’apprenant pourquoi sa réclamation est rejetée...'
                      : status === 'resolved'
                        ? 'Expliquez à l’apprenant comment sa réclamation a été résolue...'
                        : 'Écrivez une réponse claire à l’apprenant...'
                  }
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    text-sm
                    leading-6
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-[#FF6B0B]/50
                    focus:ring-4
                    focus:ring-[#FF6B0B]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:border-white/10
                    dark:bg-white/5
                    dark:text-white
                    dark:placeholder:text-slate-500
                  "
                />

              ) : (

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                    text-sm
                    leading-6
                    text-slate-600
                    dark:border-white/10
                    dark:bg-white/5
                    dark:text-slate-300
                  "
                >
                  {claim.admin_response ||
                    'Aucune réponse.'}
                </div>

              )}

              {canManage &&
                responseRequired &&
                !adminResponse.trim() && (
                  <p
                    className="
                      mt-2
                      text-xs
                      font-medium
                      text-red-500
                    "
                  >
                    Une réponse est obligatoire
                    pour clôturer cette réclamation.
                  </p>
                )}

            </div>

          </div>

          {/* HISTORIQUE */}

          {(claim.handled_by_email ||
            claim.handled_at) && (

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-5
                dark:border-white/10
                dark:bg-white/5
              "
            >

              <div className="flex items-start gap-3">

                <div
                  className="
                    flex
                    size-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-500/10
                    text-emerald-500
                  "
                >
                  <CheckCircle2 className="size-4" />
                </div>

                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Traitement enregistré
                  </p>

                  {claim.handled_by_email && (
                    <p
                      className="
                        mt-1
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Par{' '}

                      <span
                        className="
                          font-semibold
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        {claim.handled_by_email}
                      </span>
                    </p>
                  )}

                  {claim.handled_at && (
                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-400
                      "
                    >
                      Le{' '}
                      {formatDateTime(
                        claim.handled_at,
                      )}
                    </p>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* LAST UPDATE */}

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-slate-400
            "
          >
            <Clock className="size-3.5" />

            Dernière modification :
            {formatDateTime(
              claim.updated_at,
            )}
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-4
                text-sm
                text-red-600
                dark:border-red-500/20
                dark:bg-red-500/10
                dark:text-red-400
              "
            >

              <AlertCircle
                className="
                  mt-0.5
                  size-4
                  shrink-0
                "
              />

              <span>{error}</span>

            </div>
          )}

        </div>

        {/* FOOTER */}

        <div
          className="
            sticky
            bottom-0
            flex
            flex-col-reverse
            gap-3
            border-t
            border-slate-200
            bg-white
            p-6
            sm:flex-row
            sm:items-center
            sm:justify-between
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >

          <div>

            {canManage && hasChanges && (
              <p
                className="
                  text-xs
                  font-medium
                  text-amber-600
                  dark:text-amber-400
                "
              >
                Modifications non enregistrées
              </p>
            )}

          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="
                rounded-xl
                border
                border-slate-200
                px-5
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:border-white/10
                dark:text-slate-200
                dark:hover:bg-white/5
              "
            >
              Fermer
            </button>

            {canManage && (
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  !hasChanges ||
                  responseMissing
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#FF6B0B]
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  shadow-[#FF6B0B]/20
                  transition-all
                  hover:bg-[#e85f08]
                  hover:shadow-md
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Enregistrer le traitement
                  </>
                )}

              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}

// ============================================================
// DETAIL ITEM
// ============================================================

interface DetailItemProps {
  icon: React.ComponentType<{
    className?: string
  }>
  label: string
  value: string | null | undefined
}

const DetailItem: React.FC<
  DetailItemProps
> = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        p-4
        dark:border-white/10
      "
    >

      <div className="flex items-center gap-2">

        <Icon
          className="
            size-4
            text-[#FF6B0B]
          "
        />

        <span
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wider
            text-slate-400
          "
        >
          {label}
        </span>

      </div>

      <p
        className="
          mt-2
          break-words
          text-sm
          font-semibold
          text-slate-900
          dark:text-white
        "
      >
        {value || '—'}
      </p>

    </div>
  )
}

export default ClaimsPage

