
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pencil,
  Loader2,
  AlertCircle,
  Users,
  BookOpen,
  ChevronRight,
} from 'lucide-react'

import { getRentreeById } from '@/services/rentrees/rentreeService'
import { getCohortes } from '@/services/cohortes/cohorteService'

import type { Rentree } from '@/types/rentree'
import type { Cohorte } from '@/types/cohorte'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export const RentreeDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // ============================================================
  // ÉTAT
  // ============================================================

  const [rentree, setRentree] = useState<Rentree | null>(null)
  const [cohortes, setCohortes] = useState<Cohorte[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingCohortes, setLoadingCohortes] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [cohortesError, setCohortesError] = useState<string | null>(null)

  // ============================================================
  // CHARGEMENT RENTRÉE + COHORTES
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError(
          "Identifiant de la rentrée introuvable.",
        )
        setLoading(false)
        setLoadingCohortes(false)
        return
      }

      try {
        setLoading(true)
        setLoadingCohortes(true)

        setError(null)
        setCohortesError(null)

        // --------------------------------------------------------
        // RÉCUPÉRATION RENTRÉE
        // --------------------------------------------------------

        const rentreeData = await getRentreeById(id)

        if (!rentreeData) {
          setError('Rentrée introuvable.')
          return
        }

        setRentree(rentreeData)

        // --------------------------------------------------------
        // RÉCUPÉRATION DES COHORTES
        // --------------------------------------------------------

        const allCohortes = await getCohortes()

        console.log(
          '🔥 TOUTES LES COHORTES :',
          allCohortes,
        )

        // --------------------------------------------------------
        // FILTRE :
        //
        // Cohorte.intake === Rentree.id
        // --------------------------------------------------------

        const linkedCohortes = allCohortes.filter(
          (cohorte) =>
            String(cohorte.intake) === String(rentreeData.id),
        )

        console.log(
          '🔥 COHORTES DE LA RENTRÉE :',
          linkedCohortes,
        )

        setCohortes(linkedCohortes)
      } catch (err) {
        console.error(
          'Erreur chargement détail rentrée :',
          err,
        )

        setError(
          'Impossible de récupérer les informations de la rentrée.',
        )
      } finally {
        setLoading(false)
        setLoadingCohortes(false)
      }
    }

    loadData()
  }, [id])

  // ============================================================
  // LOADING PRINCIPAL
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="size-5 animate-spin" />

          <span>
            Chargement de la rentrée...
          </span>
        </div>
      </div>
    )
  }

  // ============================================================
  // ERREUR RENTRÉE
  // ============================================================

  if (error || !rentree) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() => navigate('/rentrees')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B]"
        >
          <ArrowLeft className="size-4" />

          Retour aux rentrées
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex items-start gap-3">

            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />

            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                Impossible de charger la rentrée
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error ?? 'Rentrée introuvable.'}
              </p>
            </div>

          </div>
        </div>

      </div>
    )
  }

  // ============================================================
  // NOMBRE DE COHORTES
  // ============================================================

  const nombreCohortes = cohortes.length

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>

        <button
          type="button"
          onClick={() => navigate('/rentrees')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B]"
        >
          <ArrowLeft className="size-4" />

          Retour aux rentrées
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {rentree.name || 'Rentrée sans nom'}
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Détails de la rentrée académique
            </p>
          </div>

          <Button
            onClick={() =>
              navigate(
                `/rentrees/${rentree.id}/edit`,
              )
            }
            className="rounded-xl bg-[#FF6B0B] font-semibold text-white shadow-md shadow-[#FF6B0B]/20 hover:bg-[#e85f08]"
          >
            <Pencil className="mr-2 size-4" />

            Modifier
          </Button>

        </div>

      </div>

      {/* ======================================================
          INFORMATIONS PRINCIPALES
      ====================================================== */}

      <div className="grid gap-6 md:grid-cols-3">

        {/* ====================================================
            NOM
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

          <div className="flex items-start gap-4">

            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10">
              <Calendar className="size-6 text-[#FF6B0B]" />
            </div>

            <div className="min-w-0">

              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nom de la rentrée
              </p>

              <p className="mt-1 break-words text-lg font-bold text-slate-900 dark:text-white">
                {rentree.name || 'Sans nom'}
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
            STATUT
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

          <div className="flex items-start gap-4">

            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <Clock className="size-6 text-blue-500" />
            </div>

            <div>

              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

          <div className="flex items-start gap-4">

            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <Users className="size-6 text-emerald-500" />
            </div>

            <div>

              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Cohortes
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {loadingCohortes
                  ? '...'
                  : nombreCohortes}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          INFORMATIONS RENTRÉE
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <div className="flex items-center gap-2">

          <Calendar className="size-5 text-[#FF6B0B]" />

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Informations de la rentrée
          </h2>

        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          {/* DATE DE DÉBUT */}

          <div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Date de début
            </p>

            <div className="mt-2 flex items-center gap-3">

              <div className="flex size-10 items-center justify-center rounded-lg bg-[#FF6B0B]/10">
                <Calendar className="size-5 text-[#FF6B0B]" />
              </div>

              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {formatDate(rentree.start_date)}
              </p>

            </div>

          </div>

          {/* IDENTIFIANT */}

          <div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Identifiant
            </p>

            <p className="mt-2 break-all text-sm font-medium text-slate-700 dark:text-slate-300">
              {rentree.id}
            </p>

          </div>

          {/* STATUT */}

          <div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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

      {/* ======================================================
          COHORTES DE LA RENTRÉE
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Users className="size-5 text-[#FF6B0B]" />

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cohortes de la rentrée
              </h2>

            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Les cohortes associées à cette rentrée académique.
            </p>

          </div>

          <div className="rounded-full bg-[#FF6B0B]/10 px-3 py-1 text-sm font-semibold text-[#FF6B0B]">
            {nombreCohortes}{' '}
            {nombreCohortes > 1
              ? 'cohortes'
              : 'cohorte'}
          </div>

        </div>

        {/* ----------------------------------------------------
            CHARGEMENT COHORTES
        ---------------------------------------------------- */}

        {loadingCohortes && (
          <div className="flex min-h-[180px] items-center justify-center">

            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">

              <Loader2 className="size-5 animate-spin" />

              Chargement des cohortes...

            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            ERREUR COHORTES
        ---------------------------------------------------- */}

        {!loadingCohortes && cohortesError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">

            <div className="flex items-center gap-3">

              <AlertCircle className="size-5 text-red-500" />

              <p className="text-sm text-red-600 dark:text-red-300">
                {cohortesError}
              </p>

            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            AUCUNE COHORTE
        ---------------------------------------------------- */}

        {!loadingCohortes &&
          !cohortesError &&
          cohortes.length === 0 && (
            <div className="mt-6 flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-white/10">

              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">

                <Users className="size-6 text-slate-400" />

              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Aucune cohorte
              </p>

              <p className="mt-1 text-center text-sm text-slate-400">
                Aucune cohorte n'est encore associée à cette rentrée.
              </p>

            </div>
          )}

        {/* ----------------------------------------------------
            LISTE DES COHORTES
        ---------------------------------------------------- */}

        {!loadingCohortes &&
          !cohortesError &&
          cohortes.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {cohortes.map((cohorte) => (
                <button
                  key={cohorte.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/cohortes/${cohorte.id}`,
                    )
                  }
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#FF6B0B]/40 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-[#151528]"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10">
                      <BookOpen className="size-5 text-[#FF6B0B]" />
                    </div>

                    <ChevronRight className="mt-1 size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FF6B0B]" />

                  </div>

                  <div className="mt-4">

                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {cohorte.name || 'Cohorte sans nom'}
                    </h3>

                    {cohorte.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {cohorte.description}
                      </p>
                    )}

                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">

                    <StatusBadge
                      status={cohorte.status}
                    />

                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 dark:border-white/10">

                    <div>

                      <p className="text-xs text-slate-400">
                        Apprenants
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {cohorte.members_count ??
                          cohorte.enrollments_count ??
                          0}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        Projets
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {cohorte.projects_count ?? 0}
                      </p>

                    </div>

                  </div>

                </button>
              ))}

            </div>
          )}

      </div>

      {/* ======================================================
          INFORMATIONS TECHNIQUES
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Informations complémentaires
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          {/* DATE CRÉATION */}

          <div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Créée le
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {formatDateTime(
                rentree.created_at,
              )}
            </p>

          </div>

          {/* DATE MODIFICATION */}

          <div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Dernière modification
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {formatDateTime(
                rentree.updated_at,
              )}
            </p>

          </div>

          {/* ID */}

          <div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Identifiant
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-white">
              {rentree.id}
            </p>

          </div>

        </div>

      </div>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/10">

        <Button
          variant="outline"
          onClick={() => navigate('/rentrees')}
          className="rounded-xl"
        >
          <ArrowLeft className="mr-2 size-4" />

          Retour
        </Button>

        <Button
          onClick={() =>
            navigate(
              `/rentrees/${rentree.id}/edit`,
            )
          }
          className="rounded-xl bg-[#FF6B0B] font-semibold text-white hover:bg-[#e85f08]"
        >
          <Pencil className="mr-2 size-4" />

          Modifier la rentrée
        </Button>

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

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-')

    return `${day}/${month}/${year}`
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

// ============================================================
// FORMAT DATE + HEURE
// ============================================================

const formatDateTime = (
  date?: string | null,
): string => {
  if (!date) {
    return '—'
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
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

