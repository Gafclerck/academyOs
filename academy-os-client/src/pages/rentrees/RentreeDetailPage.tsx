import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pencil,
  Loader2,
  AlertCircle,
  Users,
  GraduationCap,
  CalendarDays,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

import {
  getRentreeById,
} from '@/services/rentrees/rentreeService'

import { getCohortes } from '@/services/cohortes/cohorteService'

import type { Rentree } from '@/types/rentree'
import type { Cohorte } from '@/types/cohorte'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'

/* ============================================================
   PAGE
============================================================ */

export const RentreeDetailPage: React.FC = () => {
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
   * Admin et Organizer peuvent modifier.
   *
   * Trainer et Learner sont en consultation.
   */
  const canEdit =
    isAdmin ||
    isOrganizer

  /*
   * Le contenu du header dépend du rôle.
   */
  const pageDescription = isAdmin
    ? 'Consultez et gérez les informations de cette rentrée académique.'
    : isOrganizer
      ? 'Gérez les informations et les cohortes associées à cette rentrée.'
      : isTrainer
        ? 'Consultez les informations de la rentrée et les cohortes qui vous sont accessibles.'
        : 'Retrouvez les informations de votre parcours de formation.'

  /* ============================================================
     ÉTAT
  ============================================================ */

  const [rentree, setRentree] =
    React.useState<Rentree | null>(null)

  const [cohortes, setCohortes] =
    React.useState<Cohorte[]>([])

  const [loading, setLoading] =
    React.useState(true)

  const [loadingCohortes, setLoadingCohortes] =
    React.useState(true)

  const [error, setError] =
    React.useState<string | null>(null)

  /* ============================================================
     CHARGEMENT
  ============================================================ */

  React.useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError(
          'Identifiant de la rentrée introuvable.',
        )

        setLoading(false)
        setLoadingCohortes(false)

        return
      }

      try {
        setLoading(true)
        setLoadingCohortes(true)

        setError(null)

        /* ======================================================
           RENTRÉE
        ====================================================== */

        const rentreeData =
          await getRentreeById(id)

        if (!rentreeData) {
          setError(
            'Rentrée introuvable.',
          )

          return
        }

        setRentree(rentreeData)

        /* ======================================================
           COHORTES
           
           Le backend gère déjà le filtrage selon
           l'utilisateur connecté.
        ====================================================== */

        try {
          const allCohortes =
            await getCohortes()

          /*
           * On conserve ici uniquement le lien
           * avec la rentrée courante.
           *
           * Le filtrage utilisateur reste côté backend.
           */
          const linkedCohortes =
            allCohortes.filter(
              (cohorte) => {
                const intakeId =
                  cohorte.intake ??
                  (
                    cohorte as Cohorte & {
                      intake_id?: string | number
                    }
                  ).intake_id

                return (
                  String(intakeId) ===
                  String(rentreeData.id)
                )
              },
            )

          setCohortes(
            linkedCohortes,
          )
        } catch (cohortError) {
          console.error(
            '[RentreeDetailPage] Erreur cohortes:',
            cohortError,
          )
        }
      } catch (err) {
        console.error(
          '[RentreeDetailPage] Erreur:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de récupérer les informations de la rentrée.',
        )
      } finally {
        setLoading(false)
        setLoadingCohortes(false)
      }
    }

    loadData()
  }, [id])

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[400px]
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
            Chargement de la rentrée...
          </span>
        </div>
      </div>
    )
  }

  /* ============================================================
     ERREUR
  ============================================================ */

  if (error || !rentree) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() =>
            navigate('/rentrees')
          }
          className="
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-slate-500
            transition
            hover:text-[#FF6B0B]
          "
        >
          <ArrowLeft className="size-4" />

          Retour aux rentrées
        </button>

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
                Impossible de charger la rentrée
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-600
                  dark:text-red-300
                "
              >
                {error ??
                  'Rentrée introuvable.'}
              </p>

            </div>

          </div>
        </div>

      </div>
    )
  }

  /* ============================================================
     VARIABLES
  ============================================================ */

  const nombreCohortes =
    cohortes.length

  const rentreeName =
    rentree.name ||
    'Rentrée sans nom'

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
          navigate('/rentrees')
        }
        className="
          flex
          items-center
          gap-2
          text-sm
          font-medium
          text-slate-500
          transition
          hover:text-[#FF6B0B]
        "
      >
        <ArrowLeft className="size-4" />

        Retour aux rentrées
      </button>

      {/* ======================================================
          HERO
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
          dark:bg-[#1f1f38]
          sm:p-8
        "
      >

        {/* DECORATION */}

        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            size-48
            rounded-full
            bg-[#FF6B0B]/10
            blur-2xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-6
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          {/* INFORMATIONS */}

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
                ring-8
                ring-[#FF6B0B]/5
              "
            >

              {isLearner ? (
                <GraduationCap
                  className="
                    size-7
                    text-[#FF6B0B]
                  "
                />
              ) : (
                <CalendarDays
                  className="
                    size-7
                    text-[#FF6B0B]
                  "
                />
              )}

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
                  {rentreeName}
                </h1>

                <StatusBadge
                  status={rentree.status}
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
                {pageDescription}
              </p>

            </div>

          </div>

          {/* ACTION */}

          {canEdit && (
            <Button
              onClick={() =>
                navigate(
                  `/rentrees/${rentree.id}/edit`,
                )
              }
              className="
                h-11
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

      </div>

      {/* ======================================================
          INFORMATIONS PRINCIPALES
      ====================================================== */}

      <div
        className="
          grid
          gap-4
          md:grid-cols-3
        "
      >

        {/* ====================================================
            NOM
        ==================================================== */}

        <div
          className="
            group
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            transition
            hover:-translate-y-0.5
            hover:shadow-md
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                flex
                size-11
                shrink-0
                items-center
                justify-center
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
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Rentrée
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-base
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

        {/* ====================================================
            STATUT
        ==================================================== */}

        <div
          className="
            group
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            transition
            hover:-translate-y-0.5
            hover:shadow-md
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                flex
                size-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-500/10
              "
            >

              <Clock
                className="
                  size-5
                  text-blue-500
                "
              />

            </div>

            <div>

              <p
                className="
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Statut
              </p>

              <div className="mt-2">
                <StatusBadge
                  status={rentree.status}
                />
              </div>

            </div>

          </div>

        </div>

        {/* ====================================================
            COHORTES
        ==================================================== */}

        <div
          className="
            group
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            transition
            hover:-translate-y-0.5
            hover:shadow-md
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                flex
                size-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-emerald-500/10
              "
            >

              <Users
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
                  font-medium
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Cohortes
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-extrabold
                  text-slate-900
                  dark:text-white
                "
              >
                {loadingCohortes
                  ? '...'
                  : nombreCohortes}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          PÉRIODE
      ====================================================== */}

      <div
        className="
          overflow-hidden
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
            border-b
            border-slate-200
            px-6
            py-5
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

              <Calendar
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
                Période de formation
              </h2>

              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Dates de la rentrée académique
              </p>

            </div>

          </div>

        </div>

        <div
          className="
            grid
            gap-6
            p-6
            sm:grid-cols-2
          "
        >

          {/* DÉBUT */}

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
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Date de début
            </p>

            <div
              className="
                mt-2
                flex
                items-center
                gap-3
              "
            >

              <Calendar
                className="
                  size-5
                  text-[#FF6B0B]
                "
              />

              <p
                className="
                  text-base
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {formatDate(
                  rentree.start_date,
                )}
              </p>

            </div>

          </div>


          



     

        </div>

      </div>

      {/* ======================================================
          COHORTES
      ====================================================== */}

    

      {/* ======================================================
          INFORMATIONS TECHNIQUES
          
          UNIQUEMENT ADMIN / ORGANIZER
      ====================================================== */}

      {canEdit && (
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            dark:border-white/10
            dark:bg-[#1f1f38]
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
                bg-slate-100
                dark:bg-white/5
              "
            >

              <Clock
                className="
                  size-5
                  text-slate-500
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
                Informations complémentaires
              </h2>

              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Informations administratives de la rentrée.
              </p>

            </div>

          </div>

          <div
            className="
              mt-6
              grid
              gap-6
              md:grid-cols-3
            "
          >

            {/* CRÉATION */}

            <div>

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Créée le
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {formatDateTime(
                  rentree.created_at,
                )}
              </p>

            </div>

            {/* MODIFICATION */}

            <div>

              <p
                className="
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
                  mt-2
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {formatDateTime(
                  rentree.updated_at,
                )}
              </p>

            </div>

            {/* ID */}

            <div>

              <p
                className="
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
                  mt-2
                  break-all
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {rentree.id}
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          ACTIONS BAS DE PAGE
      ====================================================== */}

      <div
        className="
          flex
          flex-wrap
          justify-end
          gap-3
          border-t
          border-slate-200
          pt-6
          dark:border-white/10
        "
      >

        <Button
          variant="outline"
          onClick={() =>
            navigate('/rentrees')
          }
          className="
            rounded-xl
            font-semibold
          "
        >

          <ArrowLeft className="mr-2 size-4" />

          Retour

        </Button>

        {canEdit && (
          <Button
            onClick={() =>
              navigate(
                `/rentrees/${rentree.id}/edit`,
              )
            }
            className="
              rounded-xl
              bg-[#FF6B0B]
              font-semibold
              text-white
              shadow-md
              shadow-[#FF6B0B]/20
              hover:bg-[#e85f08]
            "
          >

            <Pencil className="mr-2 size-4" />

            Modifier la rentrée

          </Button>
        )}

      </div>

    </div>
  )
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

  /*
   * Évite les problèmes de timezone
   * avec les dates YYYY-MM-DD.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    const [
      year,
      month,
      day,
    ] = date.split('-')

    return `${day}/${month}/${year}`
  }

  const parsedDate =
    new Date(date)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
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

/* ============================================================
   FORMAT DATE + HEURE
============================================================ */

const formatDateTime = (
  date?: string | null,
): string => {
  if (!date) {
    return '—'
  }

  const parsedDate =
    new Date(date)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date
  }

  return parsedDate.toLocaleString(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

export default RentreeDetailPage

