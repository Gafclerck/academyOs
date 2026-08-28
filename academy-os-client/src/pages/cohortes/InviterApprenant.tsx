import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Users,
} from 'lucide-react'

import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  addLearners,
  getEnrollments,
} from '@/services/membreService'

import {
  getUsers,
  type User,
} from '@/services/users/users'

const InviterApprenant: React.FC = () => {
  const navigate = useNavigate()

  const { id: cohortId } =
    useParams<{ id: string }>()

  const [users, setUsers] =
    useState<User[]>([])

  const [
    enrolledUserIds,
    setEnrolledUserIds,
  ] = useState<string[]>([])

  const [selectedIds, setSelectedIds] =
    useState<string[]>([])

  const [search, setSearch] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [results, setResults] =
    useState<
      {
        email: string
        status: string
        detail: string
      }[]
    >([])

  // ============================================================
  // CHARGEMENT
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      if (!cohortId) {
        setError(
          'Identifiant de cohorte manquant.',
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [
          allUsers,
          enrollments,
        ] = await Promise.all([
          getUsers(),
          getEnrollments(cohortId),
        ])

        setUsers(allUsers)

        const enrolledIds =
          enrollments
            .filter(
              (enrollment) =>
                enrollment.status ===
                'active',
            )
            .map(
              (enrollment) =>
                enrollment.user.id,
            )

        setEnrolledUserIds(
          enrolledIds,
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les apprenants.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [cohortId])

  // ============================================================
  // APPRENANTS DISPONIBLES
  // ============================================================

  const availableLearners =
    useMemo(() => {
      const enrolledIds =
        new Set(enrolledUserIds)

      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      return users
        .filter(
          (user) =>
            user.role === 'learner' &&
            user.status === 'active' &&
            !enrolledIds.has(
              user.id,
            ),
        )
        .filter((user) => {
          if (!normalizedSearch) {
            return true
          }

          return (
            user.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            user.email
              .toLowerCase()
              .includes(
                normalizedSearch,
              )
          )
        })
    }, [
      users,
      enrolledUserIds,
      search,
    ])

  // ============================================================
  // SELECTION
  // ============================================================

  const toggleLearner = (
    userId: string,
  ) => {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter(
            (id) =>
              id !== userId,
          )
        : [
            ...current,
            userId,
          ],
    )
  }

  const toggleAll = () => {
    const availableIds =
      availableLearners.map(
        (user) => user.id,
      )

    const allSelected =
      availableIds.length > 0 &&
      availableIds.every(
        (userId) =>
          selectedIds.includes(
            userId,
          ),
      )

    if (allSelected) {
      setSelectedIds((current) =>
        current.filter(
          (userId) =>
            !availableIds.includes(
              userId,
            ),
        ),
      )
    } else {
      setSelectedIds((current) =>
        Array.from(
          new Set([
            ...current,
            ...availableIds,
          ]),
        ),
      )
    }
  }

  // ============================================================
  // INSCRIPTION
  // ============================================================

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    if (!cohortId) {
      setError(
        'Identifiant de cohorte manquant.',
      )
      return
    }

    if (selectedIds.length === 0) {
      setError(
        'Sélectionnez au moins un apprenant.',
      )
      return
    }

    setSubmitting(true)
    setError(null)
    setResults([])

    try {
      const selectedLearners =
        users.filter((user) =>
          selectedIds.includes(
            user.id,
          ),
        )

      const emails =
        selectedLearners.map(
          (user) => user.email,
        )



      const response =
        await addLearners(
          cohortId,
          emails,
        )

      setResults(
        response.results ?? [],
      )

      setSelectedIds([])

      // Recharger les inscriptions
      const enrollments =
        await getEnrollments(
          cohortId,
        )

      setEnrolledUserIds(
        enrollments
          .filter(
            (enrollment) =>
              enrollment.status ===
              'active',
          )
          .map(
            (enrollment) =>
              enrollment.user.id,
          ),
      )
    } catch (err) {
      console.error(
        '❌ INSCRIPTION APPRENANT:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'inscrire les apprenants.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate(
              `/cohortes/${cohortId}`,
            )
          }
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Retour à la cohorte
        </Button>

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1f1f38]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-7 animate-spin text-[#FF6B0B]" />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chargement des apprenants...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1f1f38]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              navigate(
                `/cohortes/${cohortId}`,
              )
            }
            className="size-9 rounded-lg"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
              Inviter des apprenants
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sélectionnez les apprenants
              actifs à inscrire dans cette
              cohorte.
            </p>
          </div>
        </div>
      </div>

      {/* ERREUR */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />

          <p className="text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* SUCCÈS */}

      {results.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />

          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">
              Inscription terminée
            </p>

            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">
              {
                results.filter(
                  (result) =>
                    result.status ===
                    'enrolled',
                ).length
              }{' '}
              apprenant(s) ajouté(s).
            </p>
          </div>
        </div>
      )}

      {/* FORMULAIRE */}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#1f1f38]"
      >

        {/* SEARCH */}

        <div className="border-b border-slate-200 p-5 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Rechercher un apprenant..."
              className="pl-10"
            />
          </div>
        </div>

        {/* HEADER LISTE */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-[#FF6B0B]" />

            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Apprenants actifs
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {
                  availableLearners.length
                }{' '}
                disponible(s)
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={
              availableLearners.length ===
              0
            }
          >
            Tout sélectionner
          </Button>
        </div>

        {/* LISTE */}

        <div className="divide-y divide-slate-200 dark:divide-white/10">
          {availableLearners.length ===
          0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto size-10 text-slate-300 dark:text-slate-600" />

              <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">
                Aucun apprenant disponible
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tous les apprenants actifs
                sont peut-être déjà inscrits
                dans cette cohorte.
              </p>
            </div>
          ) : (
            availableLearners.map(
              (user) => {
                const checked =
                  selectedIds.includes(
                    user.id,
                  )

                return (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleLearner(
                          user.id,
                        )
                      }
                      className="size-5 rounded border-slate-300 accent-[#FF6B0B]"
                    />

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF6B0B]/10 font-bold text-[#FF6B0B]">
                      {user.first_name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {user.full_name}
                      </p>

                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>

                    <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 sm:inline-flex">
                      Actif
                    </span>
                  </label>
                )
              },
            )
          )}
        </div>

        {/* FOOTER */}

        <div className="flex flex-col gap-4 border-t border-slate-200 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">
              {selectedIds.length}
            </strong>{' '}
            apprenant(s)
            sélectionné(s)
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/cohortes/${cohortId}`,
                )
              }
              disabled={submitting}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={
                submitting ||
                selectedIds.length === 0
              }
              className="gap-2 bg-[#FF6B0B] text-white hover:bg-[#e85f08]"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}

              {submitting
                ? 'Inscription...'
                : 'Inscrire les sélectionnés'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default InviterApprenant