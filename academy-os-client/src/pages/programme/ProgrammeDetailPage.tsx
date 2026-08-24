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
} from 'lucide-react'


import { useProgramme } from '@/hooks/useProgrammes'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'

export const ProgrammeDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const {
    data: programme,
    isLoading,
    isError,
    error,
  } = useProgramme(id)

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="size-5 animate-spin" />

          <span>
            Chargement du programme...
          </span>
        </div>
      </div>
    )
  }

  // ============================================================
  // ERREUR
  // ============================================================

  if (isError || !programme) {
    return (
      <div className="space-y-6">

        <Button
          variant="ghost"
          onClick={() => navigate('/programmes')}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Retour aux programmes
        </Button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">

          <div className="flex items-start gap-3">

            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />

            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                Impossible de charger le programme
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error instanceof Error
                  ? error.message
                  : 'Programme introuvable ou une erreur est survenue.'}
              </p>
            </div>

          </div>

        </div>

      </div>
    )
  }

  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (
    date?: string | null,
  ) => {
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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          RETOUR
      ====================================================== */}

      <button
        type="button"
        onClick={() => navigate('/programmes')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B]"
      >
        <ArrowLeft className="size-4" />

        Retour aux programmes
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

        <div className="flex items-start gap-4">

          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B0B]/10">
            <BookOpen className="size-7 text-[#FF6B0B]" />
          </div>

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {programme.nom || 'Programme sans nom'}
              </h1>

              <StatusBadge
                status={programme.statut}
              />

            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Détails du programme académique
            </p>

          </div>

        </div>

        {/* MODIFIER */}

        <Button
          onClick={() =>
            navigate(
              `/programmes/${programme.id}/edit`,
            )
          }
          className="rounded-xl bg-[#FF6B0B] px-5 font-semibold text-white shadow-lg shadow-[#FF6B0B]/20 hover:bg-[#e85f08]"
        >
          <Pencil className="mr-2 size-4" />
          Modifier
        </Button>

      </div>

      {/* ======================================================
          INFORMATIONS PRINCIPALES
      ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ====================================================
            DESCRIPTION
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528] lg:col-span-2">

          <div className="mb-4 flex items-center gap-2">

            <BookOpen className="size-5 text-[#FF6B0B]" />

            <h2 className="font-bold text-slate-900 dark:text-white">
              Informations du programme
            </h2>

          </div>

          <div className="space-y-5">

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nom
              </p>

              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {programme.nom || '—'}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {programme.description || 'Aucune description disponible.'}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Statut
              </p>

              <StatusBadge
                status={programme.statut}
              />
            </div>

          </div>

        </div>

        {/* ====================================================
            RÉSUMÉ
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

          <h2 className="mb-5 font-bold text-slate-900 dark:text-white">
            Résumé
          </h2>

          <div className="space-y-5">

            {/* RENTRÉES */}

            <div className="flex items-center gap-3">

              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Calendar className="size-5 text-blue-500" />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Rentrées
                </p>

                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  —
                </p>
              </div>

            </div>

            {/* APPRENANTS */}

            <div className="flex items-center gap-3">

              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="size-5 text-emerald-500" />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Apprenants
                </p>

                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  —
                </p>
              </div>

            </div>

            {/* DATE DE CRÉATION */}

            <div className="flex items-center gap-3">

              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Clock className="size-5 text-purple-500" />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Créé le
                </p>

                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatDate(
                    programme.created_at,
                  )}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          INFORMATIONS TECHNIQUES
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <h2 className="mb-5 font-bold text-slate-900 dark:text-white">
          Informations complémentaires
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Identifiant
            </p>

            <p className="break-all text-sm font-medium text-slate-700 dark:text-slate-300">
              {programme.id}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Dernière modification
            </p>

            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatDate(
                programme.updated_at,
              )}
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}

export default ProgrammeDetailPage