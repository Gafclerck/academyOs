import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Save,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import programmeService from '@/services/programmes/programmeService'
import cohorteService from '@/services/cohortes/cohorteService'
import { getRentrees } from '@/services/rentrees/rentreeService'

import type {
  UpdateCohorteDTO,
} from '@/types/cohorte'

/* ============================================================
   TYPES
============================================================ */

type FormData = {
  nom: string
  description: string
  programme_id: string
  rentree_id: string
  date_debut: string
  date_fin: string
  statut: string
}

type Programme = {
  id: string | number
  nom?: string
  name?: string
}

type Rentree = {
  id: string | number
  nom?: string
  name?: string
}

/* ============================================================
   FORMAT DATE
============================================================ */

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

  const year = parsedDate.getFullYear()

  const month = String(
    parsedDate.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    parsedDate.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/* ============================================================
   PAGE
============================================================ */

const CohorteEditPage: React.FC = () => {
  const navigate = useNavigate()

  const { id } = useParams<{
    id: string
  }>()

  /* ============================================================
     FORMULAIRE
  ============================================================ */

  const [formData, setFormData] =
    React.useState<FormData>({
      nom: '',
      description: '',
      programme_id: '',
      rentree_id: '',
      date_debut: '',
      date_fin: '',
      statut: 'active',
    })

  /* ============================================================
     LISTES
  ============================================================ */

  const [programmes, setProgrammes] =
    React.useState<Programme[]>([])

  const [rentrees, setRentrees] =
    React.useState<Rentree[]>([])

  /* ============================================================
     STATES
  ============================================================ */

  const [isLoading, setIsLoading] =
    React.useState(true)

  const [isSaving, setIsSaving] =
    React.useState(false)

  const [error, setError] =
    React.useState<string | null>(null)

  /* ============================================================
     CHARGER LES DONNÉES
  ============================================================ */

  const loadData = React.useCallback(
    async () => {
      if (!id) {
        setError(
          "L'identifiant de la cohorte est manquant.",
        )

        setIsLoading(false)

        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const [
          cohorte,
          programmesData,
          rentreesData,
        ] = await Promise.all([
          cohorteService.getCohorteById(id),
          programmeService.getProgrammes(),
          getRentrees(),
        ])




        setProgrammes(
          Array.isArray(programmesData)
            ? programmesData
            : [],
        )

        setRentrees(
          Array.isArray(rentreesData)
            ? rentreesData
            : [],
        )

        /* ======================================================
           RÉCUPÉRER LES VRAIS IDS
        ====================================================== */

        const programmeId =
          cohorte.program ?? ''

        const rentreeId =
          cohorte.intake ?? ''



        /* ======================================================
           PRÉREMPLIR
        ====================================================== */

        setFormData({
          nom:
            cohorte.name ?? '',

          description:
            cohorte.description ?? '',

          programme_id:
            programmeId
              ? String(programmeId)
              : '',

          rentree_id:
            rentreeId
              ? String(rentreeId)
              : '',

          date_debut:
            formatDateForInput(
              cohorte.start_date,
            ),

          date_fin:
            formatDateForInput(
              cohorte.end_date,
            ),

          statut:
            cohorte.status ?? 'active',
        })
      } catch (err) {
        console.error(
          '[CohorteEditPage] LOAD ERROR:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger la cohorte.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [id],
  )

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  React.useEffect(() => {
    loadData()
  }, [loadData])

  /* ============================================================
     HANDLE CHANGE
  ============================================================ */

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
    } = event.target

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      }),
    )
  }

  /* ============================================================
     VALIDATION
  ============================================================ */

  const validateForm = (): boolean => {
    if (!formData.nom.trim()) {
      toast.error(
        'Le nom de la cohorte est obligatoire.',
      )

      return false
    }

    if (!formData.programme_id) {
      toast.error(
        'Veuillez sélectionner un programme.',
      )

      return false
    }

    if (!formData.rentree_id) {
      toast.error(
        'Veuillez sélectionner une rentrée.',
      )

      return false
    }

    if (!formData.date_debut) {
      toast.error(
        'La date de début est obligatoire.',
      )

      return false
    }

    if (!formData.date_fin) {
      toast.error(
        'La date de fin est obligatoire.',
      )

      return false
    }

    if (
      formData.date_fin <
      formData.date_debut
    ) {
      toast.error(
        'La date de fin doit être postérieure à la date de début.',
      )

      return false
    }

    return true
  }

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!id) {
      toast.error(
        "L'identifiant de la cohorte est manquant.",
      )

      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)

      /*
       * IMPORTANT :
       * Le formulaire utilise les noms français,
       * mais l'API utilise les noms anglais.
       */

      const payload: UpdateCohorteDTO = {
        name: formData.nom.trim(),

        description:
          formData.description.trim(),

        program:
          formData.programme_id,

        intake:
          formData.rentree_id,

        start_date:
          formData.date_debut,

        end_date:
          formData.date_fin,

        status:
          formData.statut as UpdateCohorteDTO['status'],
      }


      await cohorteService.updateCohorte(
        id,
        payload,
      )


      toast.success(
        'Cohorte modifiée avec succès.',
      )

      navigate(
        `/cohortes/${id}`,
      )
    } catch (err) {
      console.error(
        '[CohorteEditPage] UPDATE ERROR:',
        err,
      )

      toast.error(
        err instanceof Error
          ? err.message
          : 'Impossible de modifier la cohorte.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  /* ============================================================
     ID MANQUANT
  ============================================================ */

  if (!id) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate('/cohortes')
          }
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Retour aux cohortes
        </Button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle className="mx-auto size-10 text-red-500" />

          <h2 className="mt-4 text-lg font-bold text-red-700 dark:text-red-400">
            Identifiant manquant
          </h2>

          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            Impossible d'identifier la cohorte à modifier.
          </p>
        </div>
      </div>
    )
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate(`/cohortes/${id}`)
          }
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Retour à la cohorte
        </Button>

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#151528]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="size-7 animate-spin text-[#FF6B0B]" />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chargement de la cohorte...
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate(`/cohortes/${id}`)
          }
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Retour à la cohorte
        </Button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-6 shrink-0 text-red-500" />

            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                Impossible de charger la cohorte
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>

              <Button
                variant="outline"
                onClick={loadData}
                className="mt-4"
              >
                <RefreshCw className="mr-2 size-4" />
                Réessayer
              </Button>
            </div>
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

      <div>
        <Button
          variant="ghost"
          onClick={() =>
            navigate(`/cohortes/${id}`)
          }
          className="mb-3 -ml-3 gap-2 text-slate-500 hover:text-[#FF6B0B]"
        >
          <ArrowLeft className="size-4" />
          Retour à la cohorte
        </Button>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Modifier la cohorte
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Modifiez les informations de cette cohorte.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* ====================================================
            INFORMATIONS
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Informations générales
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Modifiez les informations principales.
            </p>
          </div>

          <div className="space-y-5">

            <div>
              <label
                htmlFor="nom"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Nom de la cohorte
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="nom"
                name="nom"
                type="text"
                value={formData.nom}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
              />
            </div>

          </div>
        </div>

        {/* ====================================================
            PROGRAMME / RENTREE
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Programme et rentrée
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label
                htmlFor="programme_id"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <BookOpen className="size-4 text-blue-500" />
                Programme
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                id="programme_id"
                name="programme_id"
                value={formData.programme_id}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#FF6B0B] dark:border-white/10 dark:bg-[#151528] dark:text-white"
              >
                <option value="">
                  Sélectionner un programme
                </option>

                {programmes.map(
                  (programme) => (
                    <option
                      key={programme.id}
                      value={String(
                        programme.id,
                      )}
                    >
                      {programme.nom ??
                        programme.name ??
                        'Programme sans nom'}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="rentree_id"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <Calendar className="size-4 text-purple-500" />
                Rentrée
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                id="rentree_id"
                name="rentree_id"
                value={formData.rentree_id}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#FF6B0B] dark:border-white/10 dark:bg-[#151528] dark:text-white"
              >
                <option value="">
                  Sélectionner une rentrée
                </option>

                {rentrees.map(
                  (rentree) => (
                    <option
                      key={rentree.id}
                      value={String(
                        rentree.id,
                      )}
                    >
                      {rentree.nom ??
                        rentree.name ??
                        'Rentrée sans nom'}
                    </option>
                  ),
                )}
              </select>
            </div>

          </div>
        </div>

        {/* ====================================================
            DATES / STATUT
        ==================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Planning et statut
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            <div>
              <label
                htmlFor="date_debut"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <Calendar className="size-4 text-[#FF6B0B]" />
                Date de début
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                id="date_debut"
                name="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="date_fin"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <Calendar className="size-4 text-[#FF6B0B]" />
                Date de fin
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                id="date_fin"
                name="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="statut"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Statut
              </label>

              <select
                id="statut"
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-[#151528] dark:text-white"
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

          </div>
        </div>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(`/cohortes/${id}`)
            }
            disabled={isSaving}
            className="rounded-xl px-6"
          >
            Annuler
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#FF6B0B] px-6 font-semibold text-white hover:bg-[#e85f08]"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>

        </div>

      </form>
    </div>
  )
}

export default CohorteEditPage