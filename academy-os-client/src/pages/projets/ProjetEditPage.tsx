import React from 'react'
import axios from 'axios'
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Save,
} from 'lucide-react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import { toast } from 'sonner'

import projetService, {
  type Projet,
} from '@/services/projets/projetService'

import { Button } from '@/components/ui/button'

/* ============================================================
   TYPES
============================================================ */

interface ProjetFormData {
  title: string
  description: string
  status: Projet['status']
  order: number
}

/* ============================================================
   ERREUR API
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

  if (!error.response) {
    return (
      error.message ||
      'Impossible de contacter le serveur.'
    )
  }

  const data = error.response.data

  if (typeof data === 'string') {
    return data
  }

  if (data && typeof data === 'object') {
    const responseData =
      data as Record<string, unknown>

    if (
      typeof responseData.detail === 'string'
    ) {
      return responseData.detail
    }

    if (
      typeof responseData.message === 'string'
    ) {
      return responseData.message
    }

    const messages: string[] = []

    Object.entries(responseData).forEach(
      ([field, value]) => {
        if (Array.isArray(value)) {
          messages.push(
            `${field}: ${value
              .map((item) =>
                typeof item === 'string'
                  ? item
                  : JSON.stringify(item),
              )
              .join(', ')}`,
          )
        } else if (
          typeof value === 'string'
        ) {
          messages.push(
            `${field}: ${value}`,
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

export const ProjetEditPage: React.FC = () => {
  const navigate = useNavigate()

  const { projectId: id } =
    useParams<{ projectId: string }>()

  /* ==========================================================
     STATE
  ========================================================== */

  const [projet, setProjet] =
    React.useState<Projet | null>(null)

  const [formData, setFormData] =
    React.useState<ProjetFormData>({
      title: '',
      description: '',
      status: 'draft',
      order: 1,
    })

  const [isLoading, setIsLoading] =
    React.useState(true)

  const [isSaving, setIsSaving] =
    React.useState(false)

  const [error, setError] =
    React.useState<string | null>(null)

  /* ==========================================================
     CHARGER LE PROJET
  ========================================================== */

  const loadProjet =
    React.useCallback(async () => {
      if (!id) {
        setError(
          'Identifiant du projet manquant.',
        )

        setIsLoading(false)

        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const data =
          await projetService.getProjetById(
            id,
          )

        setProjet(data)

        setFormData({
          title: data.title ?? '',
          description:
            data.description ?? '',
          status:
            data.status ?? 'draft',
          order:
            Number(data.order) || 1,
        })
      } catch (err) {
        console.error(
          '[ProjetEditPage] Erreur chargement :',
          err,
        )

        const message =
          getAxiosErrorMessage(err)

        setError(message)

        toast.error(
          'Impossible de charger le projet',
          {
            description: message,
          },
        )
      } finally {
        setIsLoading(false)
      }
    }, [id])

  React.useEffect(() => {
    loadProjet()
  }, [loadProjet])

  /* ==========================================================
     CHANGEMENT INPUT
  ========================================================== */

  const handleChange = (
    event:
      React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
  ) => {
    const {
      name,
      value,
    } = event.target

    setFormData((previous) => ({
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

    if (!id) {
      toast.error(
        'Identifiant du projet manquant.',
      )

      return
    }

    /* --------------------------------------------------------
       VALIDATION
    -------------------------------------------------------- */

    if (!formData.title.trim()) {
      toast.error(
        'Le titre du projet est obligatoire.',
      )

      return
    }

    if (formData.order < 1) {
      toast.error(
        "L'ordre doit être supérieur ou égal à 1.",
      )

      return
    }

    try {
      setIsSaving(true)

      /* ------------------------------------------------------
         DONNÉES ENVOYÉES À L'API
      ------------------------------------------------------ */

      const data = {
        title: formData.title.trim(),
        description:
          formData.description.trim(),
        status: formData.status,
        order: formData.order,
      }

      console.log(
        '📤 Modification du projet :',
        data,
      )

      /* ------------------------------------------------------
         PATCH /api/v1/projects/{id}/
      ------------------------------------------------------ */

        const updatedProjet =
        await projetService.patchProjet(
            id,
            data,
        )

      console.log(
        '✅ Projet modifié :',
        updatedProjet,
      )

      toast.success(
        'Projet modifié avec succès.',
      )

      /* ------------------------------------------------------
         REDIRECTION VERS LE DÉTAIL
      ------------------------------------------------------ */

      navigate(
        `/programmes/${updatedProjet.program}/projets/${id}`,
      )
    } catch (err) {
      console.error(
        '[ProjetEditPage] Erreur modification :',
        err,
      )

      toast.error(
        'Impossible de modifier le projet',
        {
          description:
            getAxiosErrorMessage(err),
        },
      )
    } finally {
      setIsSaving(false)
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="size-5 animate-spin" />

          <span>
            Chargement du projet...
          </span>
        </div>
      </div>
    )
  }

  /* ==========================================================
     ERREUR
  ========================================================== */

  if (!projet) {
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

          Retour aux projets
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
          <p
            className="
              font-semibold
              text-red-700
              dark:text-red-400
            "
          >
            Projet introuvable
          </p>

          <p
            className="
              mt-2
              text-sm
              text-red-600
              dark:text-red-300
            "
          >
            {error ||
              'Impossible de récupérer les informations du projet.'}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate('/programmes')
            }
            className="mt-4 rounded-xl"
          >
            Retour aux projets
          </Button>
        </div>

      </div>
    )
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* ======================================================
          RETOUR
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            `/programmes/${projet.program}/projets/${projet.id}`,
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

        Retour au projet
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
          shadow-sm
          dark:border-white/10
          dark:bg-[#1f1f38]
        "
      >
        <div className="flex items-center gap-4">

          <div
            className="
              flex
              size-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#FF6B0B]/10
            "
          >
            <BookOpen
              className="
                size-6
                text-[#FF6B0B]
              "
            />
          </div>

          <div>

            <h1
              className="
                text-2xl
                font-extrabold
                tracking-tight
                text-slate-900
                dark:text-white
              "
            >
              Modifier le projet
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Modifiez les informations du projet
              <span className="font-semibold">
                {' '}
                {projet.title}
              </span>
            </p>

          </div>

        </div>
      </div>

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
          dark:bg-[#1f1f38]
        "
      >

        <div className="space-y-6">

          {/* TITRE */}

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
              <span className="text-red-500">
                {' '}*
              </span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Ex : Création d'une application web"
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#FF6B0B]
                focus:ring-2
                focus:ring-[#FF6B0B]/10
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-white/10
                dark:bg-white/[0.03]
                dark:text-white
              "
            />
          </div>

          {/* DESCRIPTION */}

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
              rows={6}
              value={formData.description}
              onChange={handleChange}
              disabled={isSaving}
              placeholder="Décrivez le projet..."
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-[#FF6B0B]
                focus:ring-2
                focus:ring-[#FF6B0B]/10
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-white/10
                dark:bg-white/[0.03]
                dark:text-white
              "
            />
          </div>

          {/* STATUT + ORDRE */}

          <div className="grid gap-6 md:grid-cols-2">

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
                disabled={isSaving}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#FF6B0B]
                  focus:ring-2
                  focus:ring-[#FF6B0B]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-white/10
                  dark:bg-[#1f1f38]
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
              </label>

              <input
                id="order"
                name="order"
                type="number"
                min={1}
                value={formData.order}
                onChange={handleChange}
                disabled={isSaving}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-[#FF6B0B]
                  focus:ring-2
                  focus:ring-[#FF6B0B]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-white/10
                  dark:bg-white/[0.03]
                  dark:text-white
                "
              />
            </div>

          </div>

        </div>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div
          className="
            mt-8
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
            disabled={isSaving}
            onClick={() =>
              navigate(
                `/projets/${projet.id}`,
              )
            }
            className="rounded-xl"
          >
            Annuler
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="
              rounded-xl
              bg-[#FF6B0B]
              font-semibold
              text-white
              shadow-sm
              hover:bg-[#e85f08]
            "
          >

            {isSaving ? (
              <>
                <Loader2
                  className="
                    mr-2
                    size-4
                    animate-spin
                  "
                />

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

export default ProjetEditPage