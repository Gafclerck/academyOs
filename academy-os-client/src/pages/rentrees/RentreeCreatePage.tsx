import React from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  useForm,
  useWatch,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parse } from 'date-fns'

import {
  createRentreeSchema,
  type CreateRentreeFormValues,
} from '../../lib/rentreeSchemas'

import { useCreateRentree } from '../../hooks/rentrees/useRentrees'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'

export const RentreeCreatePage: React.FC = () => {
  const navigate = useNavigate()

  const createRentreeMutation =
    useCreateRentree()

  const form =
    useForm<CreateRentreeFormValues>({
      resolver: zodResolver(
        createRentreeSchema,
      ),
      defaultValues: {
        name: '',
        start_date: '',
        status: 'upcoming',
      },
    })

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = form

  const watchedStartDate = useWatch({
    control,
    name: 'start_date',
  })

  const toDate = (
    value: string,
  ): Date | undefined => {
    if (!value) return undefined

    const parsed = parse(
      value,
      'yyyy-MM-dd',
      new Date(),
    )

    return Number.isNaN(
      parsed.getTime(),
    )
      ? undefined
      : parsed
  }

  const onSubmit = async (
    values: CreateRentreeFormValues,
  ) => {
    try {
      const payload = {
        name: values.name.trim(),
        start_date: values.start_date,
        status: values.status,
      }

      console.log(
        '[RentreeCreatePage] Payload:',
        payload,
      )

      const created =
        await createRentreeMutation.mutateAsync(
          payload,
        )

      toast.success(
        'Rentrée créée avec succès !',
        {
          description: `La rentrée "${created.name}" a été créée.`,
        },
      )

      navigate(
        `/rentrees/${created.id}`,
      )
    } catch (error: unknown) {
      console.error(
        '[RentreeCreatePage] Erreur:',
        error,
      )

      if (axios.isAxiosError(error)) {
        const backendData =
          error.response?.data

        let message =
          'Impossible de créer la rentrée.'

        if (
          backendData &&
          typeof backendData === 'object'
        ) {
          const data =
            backendData as Record<
              string,
              unknown
            >

          if (data.detail) {
            message = String(
              data.detail,
            )
          } else {
            message =
              Object.entries(data)
                .map(
                  ([field, value]) =>
                    `${field}: ${
                      Array.isArray(value)
                        ? value.join(', ')
                        : String(value)
                    }`,
                )
                .join(' · ')
          }
        }

        toast.error(
          'Erreur lors de la création',
          {
            description: message,
          },
        )
      } else {
        toast.error('Erreur', {
          description:
            error instanceof Error
              ? error.message
              : 'Une erreur est survenue.',
        })
      }
    }
  }

  const onInvalid = (
    invalidFields: typeof errors,
  ) => {
    console.error(
      'Formulaire invalide:',
      invalidFields,
    )

    toast.error(
      'Formulaire invalide',
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* HEADER */}

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="size-9 rounded-xl"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Nouvelle Rentrée
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Créez une nouvelle rentrée académique.
          </p>
        </div>
      </div>

      {/* FORMULAIRE */}

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] p-6 sm:p-8 shadow-sm">

        <form
          onSubmit={handleSubmit(
            onSubmit,
            onInvalid,
          )}
          className="space-y-5"
        >

          {/* NOM */}

          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider"
            >
              Nom de la rentrée
              <span className="text-[#FF6B0B]">
                {' '}*
              </span>
            </Label>

            <Input
              id="name"
              placeholder="Ex : Rentrée Octobre 2026"
              {...register('name')}
              className={`h-11 rounded-xl bg-slate-50 dark:bg-white/5 border ${
                errors.name
                  ? 'border-red-500'
                  : 'border-slate-200 dark:border-white/10'
              }`}
            />

            {errors.name && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* DATE */}

          <div className="space-y-1.5">
            <Label
              htmlFor="start_date"
              className="text-xs font-bold uppercase tracking-wider"
            >
              Date de début
              <span className="text-[#FF6B0B]">
                {' '}*
              </span>
            </Label>

            <DatePicker
              date={toDate(
                watchedStartDate,
              )}
              onDateChange={(date) => {
                setValue(
                  'start_date',
                  date
                    ? format(
                        date,
                        'yyyy-MM-dd',
                      )
                    : '',
                  {
                    shouldValidate: true,
                  },
                )
              }}
              placeholder="JJ/MM/AAAA"
              error={
                !!errors.start_date
              }
            />

            {errors.start_date && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {errors.start_date.message}
              </p>
            )}
          </div>

          {/* STATUT */}

          <div className="space-y-1.5">
            <Label
              htmlFor="status"
              className="text-xs font-bold uppercase tracking-wider"
            >
              Statut
            </Label>

            <select
              id="status"
              {...register('status')}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-1 focus:ring-[#FF6B0B] dark:border-white/10 dark:bg-white/5 dark:text-white"
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

            {errors.status && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {errors.status.message}
              </p>
            )}
          </div>

          {/* ACTIONS */}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11 px-5 rounded-xl"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting ||
                createRentreeMutation.isPending
              }
              className="h-11 px-6 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold"
            >
              {form.formState.isSubmitting ||
              createRentreeMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Créer la rentrée
                </>
              )}
            </Button>

          </div>
        </form>
      </div>
    </div>
  )
}

export default RentreeCreatePage