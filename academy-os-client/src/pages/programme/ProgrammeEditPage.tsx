import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useProgramme,
  useUpdateProgramme,
} from '@/hooks/useProgrammes'

import type {
  CreateProgrammeDTO,
  StatutProgramme,
} from '@/types/programme'

export const ProgrammeEditPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const {
    data: programme,
    isLoading,
    isError,
    error,
  } = useProgramme(id)

  const updateProgramme = useUpdateProgramme()

  const [form, setForm] = useState<CreateProgrammeDTO>({
    nom: '',
    description: '',
    statut: 'actif',
  })

  const [initialized, setInitialized] = useState(false)

  /* ============================================================
     REMPLIR LE FORMULAIRE
  ============================================================ */

  useEffect(() => {
    if (programme && !initialized) {
      setForm({
        nom: programme.nom,
        description: programme.description ?? '',
        statut: programme.statut,
      })

      setInitialized(true)
    }
  }, [programme, initialized])

  /* ============================================================
     MODIFIER
  ============================================================ */

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault()

    if (!id) {
      toast.error(
        'Identifiant du programme introuvable.',
      )
      return
    }

    if (!form.nom.trim()) {
      toast.error(
        'Le nom du programme est obligatoire.',
      )
      return
    }

    try {
      await updateProgramme.mutateAsync({
        id,
        dto: {
          nom: form.nom.trim(),
          description: form.description.trim(),
          statut: form.statut,
        },
      })

      toast.success(
        'Programme modifié avec succès.',
      )

      /*
       * La liste sera automatiquement rechargée
       * grâce à invalidateQueries().
       */
      navigate('/programmes')
    } catch (err: any) {
      console.error(
        'Erreur modification programme :',
        err,
      )

      toast.error(
        err?.response?.data?.detail ||
          "Impossible de modifier le programme.",
      )
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="size-5 animate-spin" />
          Chargement du programme...
        </div>
      </div>
    )
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (isError || !programme) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() => navigate('/programmes')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B]"
        >
          <ArrowLeft className="size-4" />
          Retour aux programmes
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex items-start gap-3">

            <AlertCircle className="mt-0.5 size-5 text-red-500" />

            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                Impossible de charger le programme
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error instanceof Error
                  ? error.message
                  : 'Programme introuvable.'}
              </p>
            </div>

          </div>
        </div>

      </div>
    )
  }

  /* ============================================================
     FORMULAIRE
  ============================================================ */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() => navigate('/programmes')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B]"
        >
          <ArrowLeft className="size-4" />
          Retour aux programmes
        </button>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Modifier le programme
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Modifiez les informations du programme.
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
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nom du programme
            </label>

            <input
              type="text"
              value={form.nom}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  nom: e.target.value,
                }))
              }
              disabled={updateProgramme.isPending}
              required
              placeholder="Ex: Développement Web"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={updateProgramme.isPending}
              rows={5}
              placeholder="Décrivez le programme..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          {/* STATUT */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Statut
            </label>

            <select
              value={form.statut}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  statut:
                    e.target.value as StatutProgramme,
                }))
              }
              disabled={updateProgramme.isPending}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f38] dark:text-white"
            >
              <option value="actif">
                Actif
              </option>

              <option value="inactif">
                Inactif
              </option>
            </select>
          </div>

          {/* ACTIONS */}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/10">

            <button
              type="button"
              onClick={() =>
                navigate('/programmes')
              }
              disabled={updateProgramme.isPending}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={updateProgramme.isPending}
              className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateProgramme.isPending ? (
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

export default ProgrammeEditPage