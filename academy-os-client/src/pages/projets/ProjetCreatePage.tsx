import React from 'react'
import axios from 'axios'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import programmeService from '@/services/programmes/programmeService'
import projetService, {
  type CreateProjetDTO,
  type ProjetStatus,
} from '@/services/projets/projetService'

import { Button } from '@/components/ui/button'

/* ============================================================
   TYPES
============================================================ */

interface Programme {
  id: string
  nom?: string
  name?: string
  description?: string
}

/* ============================================================
   AXIOS ERROR HELPER
============================================================ */

const getAxiosErrorMessage = (
  error: unknown,
): string => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return error.message
    }

    return 'Une erreur est survenue.'
  }

  const data = error.response?.data

  if (!data) {
    return (
      error.message ||
      'Une erreur réseau est survenue.'
    )
  }

  /*
   * DRF :
   * {
   *   "detail": "..."
   * }
   */
  if (
    typeof data === 'object' &&
    data !== null &&
    typeof data.detail === 'string'
  ) {
    return data.detail
  }

  /*
   * API :
   * {
   *   "title": ["Ce champ est obligatoire."],
   *   "program": ["..."]
   * }
   */
  if (
    typeof data === 'object' &&
    data !== null
  ) {
    const messages: string[] = []

    Object.entries(data).forEach(
      ([field, value]) => {
        if (Array.isArray(value)) {
          messages.push(
            `${field}: ${value
              .map(item =>
                typeof item === 'string'
                  ? item
                  : JSON.stringify(item),
              )
              .join(', ')}`,
          )

          return
        }

        if (
          typeof value === 'string'
        ) {
          messages.push(
            `${field}: ${value}`,
          )

          return
        }

        if (
          value !== null &&
          typeof value === 'object'
        ) {
          messages.push(
            `${field}: ${JSON.stringify(value)}`,
          )
        }
      },
    )

    if (messages.length > 0) {
      return messages.join(' | ')
    }
  }

  return (
    error.message ||
    'Une erreur est survenue.'
  )
}

/* ============================================================
   PAGE
============================================================ */

export const ProjetCreatePage: React.FC = () => {
  const navigate = useNavigate()

  /*
   * IMPORTANT :
   *
   * La page doit être appelée avec :
   *
   * /programmes/:id/projets/new
   *
   * Exemple :
   *
   * /programmes/abc123/projets/new
   *
   * Ici "id" = ID du programme.
   */
  const { id: programmeId } =
    useParams<{ id: string }>()

  /* ==========================================================
     PROGRAMME COURANT
  ========================================================== */

  const [
    programme,
    setProgramme,
  ] = React.useState<Programme | null>(
    null,
  )

  const [
    isLoadingProgramme,
    setIsLoadingProgramme,
  ] = React.useState(true)

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const [
    isSubmitting,
    setIsSubmitting,
  ] = React.useState(false)

  /* ==========================================================
     ERROR
  ========================================================== */

  const [
    error,
    setError,
  ] = React.useState<string | null>(null)

  /* ==========================================================
     FORM DATA
  ========================================================== */

  const [
    formData,
    setFormData,
  ] = React.useState<
    Omit<CreateProjetDTO, 'program'>
  >({
    title: '',
    description: '',
    status: 'draft',
    order: 1,
  })

  /* ==========================================================
     CHARGER LE PROGRAMME COURANT
  ========================================================== */

  React.useEffect(() => {
    let isMounted = true

    const loadProgramme = async () => {
      /*
       * Aucun ID dans l'URL
       */
      if (!programmeId) {
        setError(
          'Aucun programme n’a été spécifié.',
        )

        setIsLoadingProgramme(false)

        return
      }

      try {
        setIsLoadingProgramme(true)
        setError(null)

        console.log(
          '📚 Chargement du programme :',
          programmeId,
        )

        /*
         * IMPORTANT :
         *
         * On récupère UNIQUEMENT
         * le programme courant.
         *
         * Pas besoin de charger
         * tous les programmes.
         */
        const data =
          await programmeService.getProgrammeById(
            programmeId,
          )

        console.log(
          '✅ Programme récupéré :',
          data,
        )

        if (!isMounted) {
          return
        }

        /*
         * Selon ton service, data peut déjà
         * être le programme directement.
         */
        setProgramme(
          data as Programme,
        )
      } catch (err) {
        console.error(
          '[ProjetCreatePage] Erreur chargement programme:',
          err,
        )

        if (!isMounted) {
          return
        }

        const message =
          getAxiosErrorMessage(err)

        setError(message)

        toast.error(
          'Impossible de charger le programme',
          {
            description: message,
          },
        )
      } finally {
        if (isMounted) {
          setIsLoadingProgramme(false)
        }
      }
    }

    loadProgramme()

    return () => {
      isMounted = false
    }
  }, [programmeId])

  /* ==========================================================
     NOM DU PROGRAMME
  ========================================================== */

  const programmeName =
    programme?.nom ||
    programme?.name ||
    'Programme sans nom'

  /* ==========================================================
     CHANGE INPUT
  ========================================================== */

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

    setFormData(previous => ({
      ...previous,

      [name]:
        name === 'order'
          ? Number(value)
          : value,
    }))
  }

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    setError(null)

    /* ========================================================
       VALIDATION PROGRAMME
    ======================================================== */

    if (!programmeId) {
      toast.error(
        'Le programme est introuvable.',
      )

      return
    }

    if (!programme) {
      toast.error(
        'Les informations du programme ne sont pas disponibles.',
      )

      return
    }

    /* ========================================================
       VALIDATION TITRE
    ======================================================== */

    if (!formData.title.trim()) {
      toast.error(
        'Le titre du projet est obligatoire.',
      )

      return
    }

    /* ========================================================
       VALIDATION ORDRE
    ======================================================== */

    if (
      !Number.isInteger(
        Number(formData.order),
      ) ||
      Number(formData.order) < 1
    ) {
      toast.error(
        "L'ordre doit être supérieur ou égal à 1.",
      )

      return
    }

    /* ========================================================
       PAYLOAD
    ======================================================== */

    const payload: CreateProjetDTO = {
      /*
       * IMPORTANT :
       *
       * Le programme vient directement
       * de l'URL.
       *
       * L'utilisateur ne le sélectionne plus.
       */
      program: programmeId,

      title: formData.title.trim(),

      description:
        formData.description?.trim() || '',

      status:
        formData.status as ProjetStatus,

      order:
        Number(formData.order),
    }

    try {
      setIsSubmitting(true)

      console.log(
        '📤 POST /projects/',
        payload,
      )

      const projet =
        await projetService.createProjet(
          payload,
        )

      console.log(
        '✅ Projet créé :',
        projet,
      )

      toast.success(
        'Projet créé avec succès.',
      )

      /*
       * Après création, on retourne
       * à la liste des projets DU PROGRAMME.
       */
      navigate(
        `/programmes/${programmeId}/projets`,
        {
          replace: true,
        },
      )
    } catch (err) {
      console.error(
        '[ProjetCreatePage] Erreur création projet:',
        err,
      )

      const message =
        getAxiosErrorMessage(err)

      setError(message)

      toast.error(
        'Impossible de créer le projet',
        {
          description: message,
        },
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ============================================================
     LOADING PROGRAMME
  ============================================================ */

  if (isLoadingProgramme) {
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

  /* ============================================================
     PROGRAMME INTROUVABLE
  ============================================================ */

  if (!programmeId || !programme) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() =>
            navigate('/programmes')
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

          Retour aux programmes
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
                Programme introuvable
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-600
                  dark:text-red-300
                "
              >
                {error ||
                  'Impossible de récupérer les informations du programme.'}
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  navigate('/programmes')
                }
                className="mt-4 rounded-xl"
              >
                Retour aux programmes
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

      {/* ======================================================
          RETOUR
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            `/programmes/${programmeId}/projets`,
          )
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

        Retour aux projets
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          dark:border-white/10
          dark:bg-[#151528]
        "
      >
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
            "
          >
            <BookOpen
              className="
                size-7
                text-[#FF6B0B]
              "
            />
          </div>

          <div className="min-w-0">

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
              Créer un projet
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Ajoutez un nouveau projet au programme.
            </p>

          </div>

        </div>

        {/* ====================================================
            PROGRAMME COURANT
        ==================================================== */}

        <div
          className="
            mt-6
            rounded-xl
            border
            border-[#FF6B0B]/20
            bg-[#FF6B0B]/5
            p-4
            dark:border-[#FF6B0B]/20
            dark:bg-[#FF6B0B]/10
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex
                size-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-[#FF6B0B]/10
              "
            >
              <BookOpen
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
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Programme
              </p>

              <p
                className="
                  truncate
                  text-base
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {programmeName}
              </p>

            </div>

          </div>
        </div>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-4
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
                Une erreur est survenue
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-600
                  dark:text-red-300
                "
              >
                {error}
              </p>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================
          FORMULAIRE
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
          dark:border-white/10
          dark:bg-[#151528]
        "
      >
        <div className="space-y-6">

          {/* ==================================================
              PROGRAMME — AFFICHAGE UNIQUEMENT
          ================================================== */}

          <div>

            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
            >
              Programme
            </label>

            <div
              className="
                flex
                min-h-11
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                dark:border-white/10
                dark:bg-white/[0.03]
              "
            >

              <BookOpen
                className="
                  size-4
                  shrink-0
                  text-[#FF6B0B]
                "
              />

              <span
                className="
                  text-sm
                  font-medium
                  text-slate-900
                  dark:text-white
                "
              >
                {programmeName}
              </span>

            </div>

            <p
              className="
                mt-1.5
                text-xs
                text-slate-400
              "
            >
              Le projet sera automatiquement associé
              à ce programme.
            </p>

          </div>

          {/* ==================================================
              TITRE
          ================================================== */}

          <div>

            <label
              htmlFor="title"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
            >
              Titre du projet

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Ex : Portfolio personnel"
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#FF6B0B]
                focus:ring-2
                focus:ring-[#FF6B0B]/20
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-white/10
                dark:bg-[#10101f]
                dark:text-white
              "
            />

          </div>

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <div>

            <label
              htmlFor="description"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={
                formData.description || ''
              }
              onChange={handleChange}
              disabled={isSubmitting}
              rows={5}
              placeholder="Décrivez le projet..."
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                py-3
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#FF6B0B]
                focus:ring-2
                focus:ring-[#FF6B0B]/20
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-white/10
                dark:bg-[#10101f]
                dark:text-white
              "
            />

          </div>

          {/* ==================================================
              ORDRE + STATUT
          ================================================== */}

          <div
            className="
              grid
              gap-6
              md:grid-cols-2
            "
          >

            {/* ORDRE */}

            <div>

              <label
                htmlFor="order"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                  dark:text-slate-200
                "
              >
                Ordre

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="order"
                name="order"
                type="number"
                min={1}
                step={1}
                value={formData.order}
                onChange={handleChange}
                disabled={isSubmitting}
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#FF6B0B]
                  focus:ring-2
                  focus:ring-[#FF6B0B]/20
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-white/10
                  dark:bg-[#10101f]
                  dark:text-white
                "
              />

              <p
                className="
                  mt-1.5
                  text-xs
                  text-slate-400
                "
              >
                Position du projet dans le programme.
              </p>

            </div>

            {/* STATUT */}

            <div>

              <label
                htmlFor="status"
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                  dark:text-slate-200
                "
              >
                Statut
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting}
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#FF6B0B]
                  focus:ring-2
                  focus:ring-[#FF6B0B]/20
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-white/10
                  dark:bg-[#10101f]
                  dark:text-white
                "
              >

                <option value="draft">
                  Brouillon
                </option>

                <option value="published">
                  Publié
                </option>

                <option value="archived">
                  Archivé
                </option>

              </select>

            </div>

          </div>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              border-t
              border-slate-200
              pt-6
              sm:flex-row
              sm:justify-end
              dark:border-white/10
            "
          >

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() =>
                navigate(
                  `/programmes/${programmeId}/projets`,
                )
              }
              className="
                rounded-xl
                px-5
              "
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !programme
              }
              className="
                rounded-xl
                bg-[#FF6B0B]
                px-5
                font-semibold
                text-white
                shadow-lg
                shadow-[#FF6B0B]/20
                hover:bg-[#e85f08]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {isSubmitting ? (
                <>
                  <Loader2
                    className="
                      mr-2
                      size-4
                      animate-spin
                    "
                  />

                  Création...
                </>
              ) : (
                <>
                  <Save
                    className="
                      mr-2
                      size-4
                    "
                  />

                  Créer le projet

                  <Check
                    className="
                      ml-2
                      size-4
                    "
                  />
                </>
              )}

            </Button>

          </div>

        </div>
      </form>

    </div>
  )
}

export default ProjetCreatePage