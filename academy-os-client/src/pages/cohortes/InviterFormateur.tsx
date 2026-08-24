import React, {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  addTrainers,
} from '@/services/membreService'

import {
  getUsers,
  type User,
} from '@/services/users/users'

const InviterFormateur: React.FC = () => {
  const navigate = useNavigate()

  const { id } =
    useParams<{ id: string }>()

  /* ============================================================
     ÉTATS
  ============================================================ */

  const [users, setUsers] =
    useState<User[]>([])

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

  const [submitted, setSubmitted] =
    useState(false)

  const [results, setResults] =
    useState<
      {
        email: string
        status: string
        detail: string
      }[]
    >([])

  /* ============================================================
     CHARGER LES FORMATEURS
  ============================================================ */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const allUsers =
          await getUsers()

        setUsers(allUsers)
      } catch (err) {
        console.error(
          '[InviterFormateur] Erreur:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les formateurs.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  /* ============================================================
     FORMATEURS ACTIFS
  ============================================================ */

  const availableTrainers =
    useMemo(() => {
      const value =
        search
          .toLowerCase()
          .trim()

      return users
        .filter(
          (user) =>
            user.role === 'trainer' &&
            user.status === 'active',
        )
        .filter((user) => {
          if (!value) {
            return true
          }

          return (
            user.full_name
              ?.toLowerCase()
              .includes(value) ||
            user.email
              ?.toLowerCase()
              .includes(value)
          )
        })
    }, [
      users,
      search,
    ])

  /* ============================================================
     SÉLECTIONNER / DÉSÉLECTIONNER UN FORMATEUR
  ============================================================ */

  const toggleTrainer = (
    userId: string,
  ) => {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter(
            (id) => id !== userId,
          )
        : [
            ...current,
            userId,
          ],
    )
  }

  /* ============================================================
     TOUT SÉLECTIONNER
  ============================================================ */

  const toggleAll = () => {
    const availableIds =
      availableTrainers.map(
        (user) => user.id,
      )

    const allSelected =
      availableIds.length > 0 &&
      availableIds.every((userId) =>
        selectedIds.includes(userId),
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
      setSelectedIds((current) => [
        ...new Set([
          ...current,
          ...availableIds,
        ]),
      ])
    }
  }

  /* ============================================================
     AJOUTER LES FORMATEURS
  ============================================================ */

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault()

    if (
      !id ||
      selectedIds.length === 0
    ) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const selectedTrainers =
        users.filter((user) =>
          selectedIds.includes(
            user.id,
          ),
        )

      const emails =
        selectedTrainers.map(
          (user) => user.email,
        )

      const data =
        await addTrainers(
          id,
          emails,
        )

      setResults(
        data.results ?? [],
      )

      setSubmitted(true)

      setSelectedIds([])
    } catch (err) {
      console.error(
        '[InviterFormateur] Erreur ajout:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter les formateurs.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="space-y-6">

        <Button
          variant="ghost"
          onClick={() =>
            navigate(
              `/cohortes/${id}`,
            )
          }
          className="gap-2"
        >
          <ArrowLeft className="size-4" />

          Retour à la cohorte
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
            dark:bg-[#1f1f38]
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
              Chargement des formateurs...
            </p>
          </div>
        </div>

      </div>
    )
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-6">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-200/80
          bg-white
          p-6
          shadow-sm
          dark:border-white/10
          dark:bg-[#1f1f38]
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              navigate(
                `/cohortes/${id}`,
              )
            }
            className="
              size-9
              rounded-lg
            "
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <h1
              className="
                text-xl
                font-black
                text-slate-900
                dark:text-white
                sm:text-2xl
              "
            >
              Inviter des formateurs
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Sélectionnez les formateurs actifs
              à affecter à cette cohorte.
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================
          ERREUR
      ======================================================== */}

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

          <p
            className="
              text-sm
              text-red-600
              dark:text-red-300
            "
          >
            {error}
          </p>
        </div>
      )}

      {/* ========================================================
          SUCCÈS
      ======================================================== */}

      {submitted &&
        results.length > 0 && (
          <div
            className="
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              p-4
              dark:border-emerald-500/20
              dark:bg-emerald-500/10
            "
          >
            <CheckCircle2
              className="
                size-5
                shrink-0
                text-emerald-500
              "
            />

            <div>
              <p
                className="
                  font-bold
                  text-emerald-700
                  dark:text-emerald-400
                "
              >
                Formateurs ajoutés
                avec succès
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-emerald-600
                  dark:text-emerald-300
                "
              >
                {
                  results.filter(
                    (result) =>
                      result.status ===
                      'assigned',
                  ).length
                }{' '}
                formateur(s)
                ajouté(s).
              </p>
            </div>
          </div>
        )}

      {/* ========================================================
          FORMULAIRE
      ======================================================== */}

      <form
        onSubmit={handleSubmit}
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200/80
          bg-white
          shadow-sm
          dark:border-white/10
          dark:bg-[#1f1f38]
        "
      >

        {/* ======================================================
            RECHERCHE
        ====================================================== */}

        <div
          className="
            border-b
            border-slate-200
            p-5
            dark:border-white/10
          "
        >
          <div className="relative">

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

            <Input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
              placeholder="Rechercher un formateur..."
              className="pl-10"
            />

          </div>
        </div>

        {/* ======================================================
            ENTÊTE
        ====================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            px-5
            py-4
            dark:border-white/10
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <Users
              className="
                size-5
                text-blue-600
                dark:text-blue-400
              "
            />

            <div>

              <p
                className="
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Formateurs actifs
              </p>

              <p
                className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {availableTrainers.length}{' '}
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
              availableTrainers.length === 0
            }
          >
            Tout sélectionner
          </Button>

        </div>

        {/* ======================================================
            LISTE DES FORMATEURS
        ====================================================== */}

        <div
          className="
            divide-y
            divide-slate-200
            dark:divide-white/10
          "
        >

          {availableTrainers.length === 0 ? (
            <div
              className="
                p-10
                text-center
              "
            >

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
                Aucun formateur disponible
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Aucun formateur actif
                ne correspond à votre recherche.
              </p>

            </div>
          ) : (
            availableTrainers.map(
              (user) => {
                const checked =
                  selectedIds.includes(
                    user.id,
                  )

                return (
                  <label
                    key={user.id}
                    className="
                      flex
                      cursor-pointer
                      items-center
                      gap-4
                      px-5
                      py-4
                      transition
                      hover:bg-slate-50
                      dark:hover:bg-white/5
                    "
                  >

                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleTrainer(
                          user.id,
                        )
                      }
                      className="
                        size-5
                        rounded
                        border-slate-300
                        accent-blue-600
                      "
                    />

                    {/* AVATAR */}

                    <div
                      className="
                        flex
                        size-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-500/10
                        font-bold
                        text-blue-600
                        dark:text-blue-400
                      "
                    >
                      {(
                        user.first_name ||
                        user.full_name ||
                        'F'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {/* INFORMATIONS */}

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >

                      <p
                        className="
                          font-semibold
                          text-slate-900
                          dark:text-white
                        "
                      >
                        {user.full_name}
                      </p>

                      <p
                        className="
                          truncate
                          text-sm
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        {user.email}
                      </p>

                    </div>

                    {/* STATUT */}

                    <span
                      className="
                        hidden
                        rounded-full
                        bg-emerald-50
                        px-2.5
                        py-1
                        text-xs
                        font-semibold
                        text-emerald-600
                        dark:bg-emerald-500/10
                        dark:text-emerald-400
                        sm:inline-flex
                      "
                    >
                      Actif
                    </span>

                  </label>
                )
              },
            )
          )}

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-t
            border-slate-200
            p-5
            dark:border-white/10
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <p
            className="
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            <strong
              className="
                text-slate-900
                dark:text-white
              "
            >
              {selectedIds.length}
            </strong>{' '}
            formateur(s)
            sélectionné(s)
          </p>

          <div className="flex gap-2">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/cohortes/${id}`,
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
              className="
                gap-2
                bg-blue-600
                text-white
                hover:bg-blue-700
              "
            >

              {submitting ? (
                <Loader2
                  className="
                    size-4
                    animate-spin
                  "
                />
              ) : (
                <UserPlus
                  className="size-4"
                />
              )}

              {submitting
                ? 'Ajout en cours...'
                : 'Ajouter les sélectionnés'}

            </Button>

          </div>

        </div>

      </form>

      {/* ========================================================
          RÉSULTATS
      ======================================================== */}

      {submitted &&
        results.length > 0 && (
          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200/80
              bg-white
              shadow-sm
              dark:border-white/10
              dark:bg-[#1f1f38]
            "
          >

            <div
              className="
                border-b
                border-slate-200
                p-5
                dark:border-white/10
              "
            >
              <h3
                className="
                  text-sm
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Résultats
              </h3>
            </div>

            <div
              className="
                divide-y
                divide-slate-200
                dark:divide-white/10
              "
            >

              {results.map(
                (result, index) => (
                  <div
                    key={`${result.email}-${index}`}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      p-4
                    "
                  >

                    <span
                      className="
                        truncate
                        text-sm
                        font-mono
                        text-slate-700
                        dark:text-slate-300
                      "
                    >
                      {result.email}
                    </span>

                    <span
                      className={`
                        shrink-0
                        text-xs
                        font-semibold
                        ${
                          result.status ===
                          'assigned'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      `}
                    >
                      {result.detail}
                    </span>

                  </div>
                ),
              )}

            </div>

            <div
              className="
                border-t
                border-slate-200
                p-5
                dark:border-white/10
              "
            >
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/cohortes/${id}`,
                  )
                }
              >
                Retour à la cohorte
              </Button>
            </div>

          </div>
        )}

    </div>
  )
}

export default InviterFormateur