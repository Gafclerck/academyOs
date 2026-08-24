import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Pencil,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { getRentreeById } from '@/services/rentrees/rentreeService'
import type { Rentree } from '@/types/rentree'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'

export const RentreeDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // ============================================================
  // ÉTAT
  // ============================================================

  const [rentree, setRentree] = useState<Rentree | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ============================================================
  // CHARGEMENT DE LA RENTRÉE
  // ============================================================

  useEffect(() => {
    const loadRentree = async () => {
      if (!id) {
        setError(
          'Identifiant de la rentrée introuvable.',
        )
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const data = await getRentreeById(id)

        if (!data) {
          setError('Rentrée introuvable.')
          return
        }

        setRentree(data)
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
      }
    }

    loadRentree()
  }, [id])

  // ============================================================
  // LOADING
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
  // ERREUR
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
              {rentree.name}
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

      <div className="grid gap-6 md:grid-cols-2">

        {/* NOM */}

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

        {/* STATUT */}

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

      </div>

      {/* ======================================================
          DATES
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Informations de la rentrée
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

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

        </div>

      </div>

      {/* ======================================================
          INFORMATIONS TECHNIQUES
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Informations complémentaires
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">

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
    const [year, month, day] =
      date.split('-')

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