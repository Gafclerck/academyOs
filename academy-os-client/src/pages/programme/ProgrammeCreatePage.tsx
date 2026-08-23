import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

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

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (
    values: CreateProgrammeFormValues,
  ) => {
    try {
      const created =
        await createProgrammeMutation.mutateAsync(
          values,
        )

      toast.success(
        'Programme créé avec succès !',
        {
          description: `Le programme "${created.nom}" est prêt.`,
        },
      )

      navigate(
        `/programmes/${created.id}`,
      )
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création du programme.'

      toast.error('Erreur', {
        description: msg,
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            navigate('/programmes')
          }
          className="size-9 rounded-xl border-slate-200 dark:border-white/10"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Nouveau Programme
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Remplissez les informations pour
            initialiser un nouveau cursus
            académique.
          </p>
        </div>

      </div>

      {/* FORMULAIRE */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] p-6 sm:p-8 shadow-sm">

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >

          {/* NOM */}
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
              placeholder="Ex: Mastère Développement Web Fullstack"
              {...register('nom')}
              className={`h-11 rounded-xl bg-slate-50 dark:bg-white/5 border ${
                errors.nom
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-slate-200 dark:border-white/10'
              }`}
            />

            {errors.nom && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3.5" />
                {errors.nom.message}
              </p>
            )}

          </div>

          {/* DESCRIPTION */}
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
              className={`w-full p-3.5 text-sm rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all ${
                errors.description
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-200 dark:border-white/10 focus:ring-1 focus:ring-[#FF6B0B]'
              }`}
            />

            {errors.description && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3.5" />
                {errors.description.message}
              </p>
            )}

          </div>

          {/* STATUT */}
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
              className="w-full h-11 px-3.5 text-sm rounded-xl bg-slate-50 dark:bg-[#151528] border border-slate-200 dark:border-white/10 outline-none focus:ring-1 focus:ring-[#FF6B0B] cursor-pointer"
            >
              <option value="actif">
                Actif (Ouvert aux inscriptions)
              </option>

              <option value="inactif">
                Inactif (Brouillon / En pause)
              </option>
            </select>

            {errors.statut && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3.5" />
                {errors.statut.message}
              </p>
            )}

          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate('/programmes')
              }
              className="h-11 px-5 rounded-xl border-slate-200 dark:border-white/10 font-semibold"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                createProgrammeMutation.isPending
              }
              className="h-11 px-6 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 transition-all"
            >
              {isSubmitting ||
              createProgrammeMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Créer le Programme
                </>
              )}
            </Button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default ProgrammeCreatePage