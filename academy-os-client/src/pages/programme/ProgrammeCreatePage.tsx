import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  X,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'

import {
  createProgrammeSchema,
  type CreateProgrammeFormValues,
} from '../../lib/programmeSchemas'

import { useCreateProgramme } from '../../hooks/useProgrammes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const ProgrammeCreatePage: React.FC = () => {
  const navigate = useNavigate()

  const createProgrammeMutation =
    useCreateProgramme()

  /* ============================================================
     ÉTAT DU MODAL
  ============================================================ */

  const [showSuccessModal, setShowSuccessModal] =
    useState(false)

  const [createdProgramme, setCreatedProgramme] =
    useState<{
      id: string
      nom: string
    } | null>(null)

  /* ============================================================
     FORMULAIRE
  ============================================================ */

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CreateProgrammeFormValues>({
    resolver: zodResolver(
      createProgrammeSchema,
    ),

    defaultValues: {
      nom: '',
      description: '',
      statut: 'actif',
    },
  })

  /* ============================================================
     CRÉER LE PROGRAMME
  ============================================================ */

  const onSubmit = async (
    values: CreateProgrammeFormValues,
  ) => {
    try {
      const created =
        await createProgrammeMutation.mutateAsync(
          values,
        )


      setCreatedProgramme({
        id: String(created.id),
        nom: created.nom,
      })

      setShowSuccessModal(true)

    } catch (err: unknown) {
      console.error(
        'Erreur création programme :',
        err,
      )

      window.alert(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création du programme.',
      )
    }
  }

  /* ============================================================
     FERMER LE MODAL
  ============================================================ */

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
  }

  /* ============================================================
     CRÉER UN AUTRE PROGRAMME
  ============================================================ */

  const handleCreateAnother = () => {
    setShowSuccessModal(false)

    setCreatedProgramme(null)

    reset({
      nom: '',
      description: '',
      statut: 'actif',
    })
  }

  /* ============================================================
     VOIR LE PROGRAMME
  ============================================================ */

  const handleViewProgramme = () => {
    if (!createdProgramme?.id) {
      return
    }

    navigate(
      `/programmes/${createdProgramme.id}`,
    )
  }

  /* ============================================================
     LOADING
  ============================================================ */

  const isLoading =
    isSubmitting ||
    createProgrammeMutation.isPending

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      {/* ========================================================
          PAGE PRINCIPALE
      ======================================================== */}

      <div className="mx-auto max-w-2xl space-y-6">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center gap-3">

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              navigate('/programmes')
            }
            disabled={isLoading}
            className="size-9 rounded-xl border-slate-200 dark:border-white/10"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>

            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
              Nouveau Programme
            </h1>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Remplissez les informations pour
              initialiser un nouveau cursus
              académique.
            </p>

          </div>

        </div>

        {/* ======================================================
            FORMULAIRE
        ====================================================== */}

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1f1f38] sm:p-8">

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >

            {/* ==================================================
                NOM
            ================================================== */}

            <div className="space-y-1.5">

              <Label
                htmlFor="nom"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Nom du Programme{' '}
                <span className="text-[#FF6B0B]">
                  *
                </span>
              </Label>

              <Input
                id="nom"
                type="text"
                placeholder="Ex: Mastère Développement Web Fullstack"
                {...register('nom')}
                disabled={isLoading}
                className={`h-11 rounded-xl border bg-slate-50 dark:bg-white/5 ${
                  errors.nom
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-slate-200 dark:border-white/10'
                }`}
              />

              {errors.nom && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                  <AlertCircle className="size-3.5" />
                  {errors.nom.message}
                </p>
              )}

            </div>

            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <div className="space-y-1.5">

              <Label
                htmlFor="description"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Description{' '}
                <span className="text-[#FF6B0B]">
                  *
                </span>
              </Label>

              <textarea
                id="description"
                rows={4}
                placeholder="Décrivez les objectifs pédagogiques, technologies abordées et compétences visées..."
                {...register('description')}
                disabled={isLoading}
                className={`w-full resize-none rounded-xl border bg-slate-50 p-3.5 text-sm outline-none transition-all dark:bg-white/5 ${
                  errors.description
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-1 focus:ring-[#FF6B0B] dark:border-white/10'
                }`}
              />

              {errors.description && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                  <AlertCircle className="size-3.5" />
                  {errors.description.message}
                </p>
              )}

            </div>

            {/* ==================================================
                STATUT
            ================================================== */}

            <div className="space-y-1.5">

              <Label
                htmlFor="statut"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Statut initial{' '}
                <span className="text-[#FF6B0B]">
                  *
                </span>
              </Label>

              <select
                id="statut"
                {...register('statut')}
                disabled={isLoading}
                className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-[#FF6B0B] dark:border-white/10 dark:bg-[#151528] dark:text-white"
              >

                <option value="actif">
                  Actif (Ouvert aux inscriptions)
                </option>

                <option value="inactif">
                  Inactif (Brouillon / En pause)
                </option>

              </select>

              {errors.statut && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                  <AlertCircle className="size-3.5" />
                  {errors.statut.message}
                </p>
              )}

            </div>

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-white/10">

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  navigate('/programmes')
                }
                className="h-11 rounded-xl border-slate-200 px-5 font-semibold dark:border-white/10"
              >
                Annuler
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 rounded-xl bg-[#FF6B0B] px-6 font-semibold text-white shadow-lg shadow-[#FF6B0B]/25 transition-all hover:bg-[#ff7a24] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-4" />
                    Créer le Programme
                  </>
                )}

              </Button>

            </div>

          </form>

        </div>

      </div>

      {/* ========================================================
          MODAL DE SUCCÈS
      ======================================================== */}

      {showSuccessModal &&
        createdProgramme && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={handleCloseSuccessModal}
          >

            {/* ==================================================
                MODAL
            ================================================== */}

            <div
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151528]"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* ==================================================
                  DÉCORATION
              ================================================== */}

              <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[#FF6B0B]/10 blur-2xl" />

              {/* ==================================================
                  HEADER
              ================================================== */}

              <div className="relative border-b border-slate-200 px-6 pb-5 pt-6 dark:border-white/10">

                <div className="relative flex items-start justify-between">

                  {/* TITRE */}

                  <div className="flex items-center gap-4">

                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
                      <CheckCircle2 className="size-6" />
                    </div>

                    <div>

                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Programme créé
                      </h2>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        La création du programme est terminée.
                      </p>

                    </div>

                  </div>

                  {/* FERMER */}

                  <button
                    type="button"
                    onClick={
                      handleCloseSuccessModal
                    }
                    className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Fermer"
                  >
                    <X className="size-5" />
                  </button>

                </div>

              </div>

              {/* ==================================================
                  CONTENU
              ================================================== */}

              <div className="space-y-5 p-6">

                {/* SUCCÈS */}

                <div className="flex flex-col items-center py-2 text-center">

                  <div className="flex size-20 items-center justify-center rounded-full bg-[#FF6B0B]/10">

                    <div className="flex size-14 items-center justify-center rounded-full bg-[#FF6B0B]/15">

                      <CheckCircle2 className="size-8 text-[#FF6B0B]" />

                    </div>

                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    Programme créé avec succès !
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Le programme suivant a été
                    ajouté à votre espace de gestion.
                  </p>

                </div>

                {/* PROGRAMME */}

                <div className="rounded-2xl border border-[#FF6B0B]/20 bg-[#FF6B0B]/5 p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
                      <BookOpen className="size-5" />
                    </div>

                    <div className="min-w-0">

                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Nouveau programme
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                        {createdProgramme.nom}
                      </p>

                    </div>

                  </div>

                </div>

                {/* INFORMATION */}

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">

                  <div className="flex items-start gap-3">

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">

                      <Check className="size-4 text-emerald-500" />

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Création réussie
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Le programme est maintenant
                        disponible. Vous pouvez
                        consulter ses détails ou
                        continuer à créer d'autres
                        programmes.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5 dark:border-white/10">

                {/* CRÉER AUTRE */}

                <button
                  type="button"
                  onClick={
                    handleCreateAnother
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Créer un autre
                </button>

                {/* VOIR */}

                <button
                  type="button"
                  onClick={
                    handleViewProgramme
                  }
                  className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08]"
                >
                  <BookOpen className="size-4" />
                  Voir le programme
                </button>

              </div>

            </div>

          </div>
        )}

    </>
  )
}

export default ProgrammeCreatePage

