import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { useUpdateRentree } from '@/hooks/rentrees/useRentrees'
import { getRentreeById } from '@/services/rentrees/rentreeService'

import type {
  StatutRentree,
} from '@/types/rentree'

export const RentreeEditPage: React.FC = () => {
  const navigate = useNavigate()

  const { id } = useParams<{
    id: string
  }>()

  // ============================================================
  // MUTATION
  // ============================================================

  const updateRentreeMutation =
    useUpdateRentree()

  // ============================================================
  // FORMULAIRE
  // ============================================================

  const [form, setForm] = useState<{
    name: string
    start_date: string
    status: StatutRentree
  }>({
    name: '',
    start_date: '',
    status: 'upcoming',
  })

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  // ============================================================
  // CHARGER LA RENTRÉE
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

        const rentree =
          await getRentreeById(id)

        if (!rentree) {
          setError(
            'Rentrée introuvable.',
          )

          return
        }

        setForm({
          name: rentree.name ?? '',

          start_date:
            formatDateForInput(
              rentree.start_date,
            ),

          status:
            rentree.status ?? 'upcoming',
        })
      } catch (err) {
        console.error(
          'Erreur chargement rentrée :',
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
  // MODIFIER
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault()

    if (!id) {
      toast.error(
        'Identifiant de la rentrée introuvable.',
      )

      return
    }

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!form.name.trim()) {
      toast.error(
        'Le nom de la rentrée est obligatoire.',
      )

      return
    }

    if (!form.start_date) {
      toast.error(
        'La date de début est obligatoire.',
      )

      return
    }

    try {
      await updateRentreeMutation.mutateAsync(
        {
          id,

          data: {
            name: form.name.trim(),
            start_date: form.start_date,
            status: form.status,
          },
        },
      )

      toast.success(
        'Rentrée modifiée avec succès.',
      )

      navigate('/rentrees')
    } catch (err: any) {
      console.error(
        'Erreur modification rentrée :',
        err,
      )

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.status?.[0] ||
        'Impossible de modifier la rentrée.'

      toast.error(message)
    }
  }

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
  // ERREUR CHARGEMENT
  // ============================================================

  if (error) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() =>
            navigate('/rentrees')
          }
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
                {error}
              </p>

            </div>

          </div>

        </div>

      </div>
    )
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>

        <button
          type="button"
          onClick={() =>
            navigate('/rentrees')
          }
          disabled={
            updateRentreeMutation.isPending
          }
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="size-4" />

          Retour aux rentrées
        </button>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Modifier la rentrée
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Modifiez les informations de la rentrée académique.
        </p>

      </div>

      {/* FORMULAIRE */}

      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* NOM */}

          <div>

            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Nom de la rentrée
            </label>

            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              disabled={
                updateRentreeMutation.isPending
              }
              required
              placeholder="Ex : Rentrée Janvier 2027"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />

          </div>

          {/* DATE DE DÉBUT */}

          <div>

            <label
              htmlFor="start_date"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Date de début
            </label>

            <input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  start_date:
                    e.target.value,
                }))
              }
              disabled={
                updateRentreeMutation.isPending
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />

          </div>

          {/* STATUT */}

          <div>

            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Statut
            </label>

            <select
              id="status"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status:
                    e.target.value as StatutRentree,
                }))
              }
              disabled={
                updateRentreeMutation.isPending
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f38] dark:text-white"
            >

              <option value="upcoming">
                À venir
              </option>

              <option value="ongoing">
                En cours
              </option>

              <option value="completed">
                Terminée
              </option>

            </select>

          </div>

          {/* ERREUR */}

          {updateRentreeMutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">

              <div className="flex items-start gap-3">

                <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />

                <div>

                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    La modification a échoué
                  </p>

                  <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                    Vérifiez les informations saisies puis réessayez.
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/10">

            <button
              type="button"
              onClick={() =>
                navigate('/rentrees')
              }
              disabled={
                updateRentreeMutation.isPending
              }
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                updateRentreeMutation.isPending
              }
              className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {updateRentreeMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />

                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="size-4" />

                  Enregistrer les modifications
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

// ============================================================
// DATE POUR INPUT HTML
// ============================================================

const formatDateForInput = (
  date?: string | null,
): string => {
  if (!date) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate
    .toISOString()
    .split('T')[0]
}

export default RentreeEditPage