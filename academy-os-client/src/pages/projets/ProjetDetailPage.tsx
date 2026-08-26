import React from 'react'
import axios from 'axios'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import projetService, {
  type Projet,
  type ProjetAttachment,
} from '@/services/projets/projetService'

import { Button } from '@/components/ui/button'

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

  if (
    data &&
    typeof data === 'object'
  ) {
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
   HELPERS
============================================================ */

const formatDate = (
  date: string,
): string => {
  if (!date) {
    return '—'
  }

  try {
    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    ).format(new Date(date))
  } catch {
    return date
  }
}

const formatFileSize = (
  bytes?: number,
): string => {
  if (!bytes) {
    return ''
  }

  if (bytes < 1024) {
    return `${bytes} octets`
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} Ko`
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} Mo`
}

const getStatusLabel = (
  status: Projet['status'],
): string => {
  switch (status) {
    case 'published':
      return 'Publié'

    case 'archived':
      return 'Archivé'

    case 'draft':
    default:
      return 'Brouillon'
  }
}

const getStatusClasses = (
  status: Projet['status'],
): string => {
  switch (status) {
    case 'published':
      return `
        bg-green-50
        text-green-700
        dark:bg-green-500/10
        dark:text-green-400
      `

    case 'archived':
      return `
        bg-slate-100
        text-slate-600
        dark:bg-white/10
        dark:text-slate-300
      `

    case 'draft':
    default:
      return `
        bg-amber-50
        text-amber-700
        dark:bg-amber-500/10
        dark:text-amber-400
      `
  }
}

/* ============================================================
   PAGE
============================================================ */

export const ProjetDetailPage: React.FC = () => {
  const navigate = useNavigate()

  const { id: projetId } =
    useParams<{ id: string }>()

  /* ==========================================================
     STATE PROJET
  ========================================================== */

  const [
    projet,
    setProjet,
  ] = React.useState<Projet | null>(null)

  const [
    isLoading,
    setIsLoading,
  ] = React.useState(true)

  const [
    error,
    setError,
  ] = React.useState<string | null>(null)

  /* ==========================================================
     STATE UPLOAD
  ========================================================== */

  const [
    selectedFile,
    setSelectedFile,
  ] = React.useState<File | null>(null)

  const [
    isUploading,
    setIsUploading,
  ] = React.useState(false)

  const [
    editingAttachmentId,
    setEditingAttachmentId,
  ] = React.useState<string | null>(null)

  const fileInputRef =
    React.useRef<HTMLInputElement | null>(null)

  /* ==========================================================
     CHARGER LE PROJET
  ========================================================== */

  const loadProjet = React.useCallback(
    async () => {
      if (!projetId) {
        setError(
          'Aucun projet n’a été spécifié.',
        )

        setIsLoading(false)

        return
      }

      try {
        setIsLoading(true)
        setError(null)

        console.log(
          '📚 Chargement du projet :',
          projetId,
        )

        const data =
          await projetService.getProjetById(
            projetId,
          )

        console.log(
          '✅ Projet récupéré :',
          data,
        )

        setProjet(data)
      } catch (err) {
        console.error(
          '[ProjetDetailPage] Erreur chargement projet:',
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
    },
    [projetId],
  )

  React.useEffect(() => {
    loadProjet()
  }, [loadProjet])

  /* ==========================================================
     SÉLECTION FICHIER POUR AJOUT
  ========================================================== */

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    const maxSize =
      10 * 1024 * 1024

    if (file.size > maxSize) {
      toast.error(
        'Fichier trop volumineux',
        {
          description:
            'La taille maximale autorisée est de 10 Mo.',
        },
      )

      event.target.value = ''

      return
    }

    setSelectedFile(file)
  }

  /* ==========================================================
     SUPPRIMER FICHIER SÉLECTIONNÉ
  ========================================================== */

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /* ==========================================================
     AJOUTER UNE PIÈCE JOINTE
  ========================================================== */

  const handleUploadAttachment =
    async () => {
      if (!projet) {
        toast.error(
          'Le projet est introuvable.',
        )

        return
      }

      if (!selectedFile) {
        toast.error(
          'Veuillez sélectionner un fichier.',
        )

        return
      }

      try {
        setIsUploading(true)

        console.log(
          '📎 Ajout du fichier :',
          selectedFile.name,
        )

        const updatedProjet =
          await projetService.addAttachment(
            projet.id,
            selectedFile,
          )

        console.log(
          '✅ Attachment associé au projet :',
          updatedProjet,
        )

        setProjet(updatedProjet)

        setSelectedFile(null)

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        toast.success(
          'Fichier ajouté avec succès.',
        )
      } catch (err) {
        console.error(
          '[ProjetDetailPage] Erreur upload attachment:',
          err,
        )

        toast.error(
          'Impossible d’ajouter le fichier',
          {
            description:
              getAxiosErrorMessage(err),
          },
        )
      } finally {
        setIsUploading(false)
      }
    }

  /* ==========================================================
     MODIFIER / REMPLACER UNE PIÈCE JOINTE
  ========================================================== */

  const handleModifyAttachment = (
    attachment: ProjetAttachment,
  ) => {
    if (!projet) {
      toast.error(
        'Le projet est introuvable.',
      )

      return
    }

    const input =
      document.createElement('input')

    input.type = 'file'

    input.onchange = async (
      event: Event,
    ) => {
      const target =
        event.target as HTMLInputElement

      const file =
        target.files?.[0]

      if (!file) {
        return
      }

      const maxSize =
        10 * 1024 * 1024

      if (file.size > maxSize) {
        toast.error(
          'Fichier trop volumineux',
          {
            description:
              'La taille maximale autorisée est de 10 Mo.',
          },
        )

        return
      }

      try {
        setIsUploading(true)

        setEditingAttachmentId(
          attachment.id,
        )

        console.log(
          '🔄 Remplacement de la pièce jointe :',
          attachment.original_filename,
        )

        console.log(
          '📎 Nouveau fichier :',
          file.name,
        )

        /* ====================================================
           1. SUPPRIMER L'ANCIEN ATTACHMENT
        ==================================================== */

        await projetService.removeAttachment(
          projet.id,
          attachment.id,
        )

        console.log(
          '🗑️ Ancienne pièce jointe supprimée.',
        )

        /* ====================================================
           2. AJOUTER LE NOUVEAU FICHIER
        ==================================================== */

        const updatedProjet =
          await projetService.addAttachment(
            projet.id,
            file,
          )

        console.log(
          '✅ Nouvelle pièce jointe ajoutée.',
        )

        setProjet(updatedProjet)

        toast.success(
          'Pièce jointe modifiée avec succès.',
          {
            description:
              `${file.name} remplace l'ancien fichier.`,
          },
        )
      } catch (err) {
        console.error(
          '[ProjetDetailPage] Erreur modification attachment:',
          err,
        )

        toast.error(
          'Impossible de modifier la pièce jointe',
          {
            description:
              getAxiosErrorMessage(err),
          },
        )

        /* ====================================================
           RECHARGER LE PROJET EN CAS D'ERREUR
        ==================================================== */

        try {
          const refreshedProjet =
            await projetService.getProjetById(
              projet.id,
            )

          setProjet(refreshedProjet)
        } catch (reloadError) {
          console.error(
            'Erreur rechargement projet:',
            reloadError,
          )
        }
      } finally {
        setIsUploading(false)
        setEditingAttachmentId(null)
      }
    }

    input.click()
  }

  /* ==========================================================
     ATTACHMENTS
  ========================================================== */

  const attachments: ProjetAttachment[] =
    projet?.attachments ?? []

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
     PROJET INTROUVABLE
  ========================================================== */

  if (!projetId || !projet) {
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

            <X
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
                Projet introuvable
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
                  'Impossible de récupérer les informations du projet.'}
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
            `/programmes/${projet.program}/projets`,
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
          shadow-sm
          dark:border-white/10
          dark:bg-[#151528]
        "
      >

        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >

          {/* ==================================================
              INFORMATIONS PROJET
          ================================================== */}

          <div className="flex min-w-0 items-start gap-4">

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

              <div className="flex flex-wrap items-center gap-3">

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
                  {projet.title}
                </h1>

                <span
                  className={`
                    inline-flex
                    items-center
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    ${getStatusClasses(
                      projet.status,
                    )}
                  `}
                >
                  {getStatusLabel(
                    projet.status,
                  )}
                </span>

              </div>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {projet.program_title ||
                  'Projet'}
              </p>

            </div>

          </div>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >

            {/* ORDRE */}

            <div
              className="
                flex
                items-center
                gap-2
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              <Clock className="size-4" />

              <span>
                Ordre :{' '}
                <strong className="text-slate-900 dark:text-white">
                  {projet.order}
                </strong>
              </span>
            </div>

            {/* MODIFIER LE PROJET */}

            <Button
              type="button"
              onClick={() =>
                navigate(
                  `/projets/${projet.id}/edit`,
                )
              }
              className="
                rounded-xl
                bg-[#FF6B0B]
                font-semibold
                text-white
                shadow-sm
                transition-all
                hover:bg-[#e85f08]
                hover:shadow-md
              "
            >
              <Pencil className="mr-2 size-4" />

              Modifier
            </Button>

          </div>

        </div>

      </div>

      {/* ======================================================
          INFORMATIONS
      ====================================================== */}

      <div
        className="
          grid
          gap-6
          lg:grid-cols-3
        "
      >

        {/* ====================================================
            DESCRIPTION
        ==================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            lg:col-span-2
            dark:border-white/10
            dark:bg-[#151528]
          "
        >

          <div className="mb-5 flex items-center gap-3">

            <div
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-xl
                bg-[#FF6B0B]/10
              "
            >
              <FileText
                className="
                  size-5
                  text-[#FF6B0B]
                "
              />
            </div>

            <div>

              <h2
                className="
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Description
              </h2>

              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Présentation du projet
              </p>

            </div>

          </div>

          <p
            className="
              whitespace-pre-wrap
              text-sm
              leading-7
              text-slate-600
              dark:text-slate-300
            "
          >
            {projet.description?.trim() ||
              'Aucune description disponible.'}
          </p>

        </div>

        {/* ====================================================
            INFORMATIONS
        ==================================================== */}

        <div
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

          <h2
            className="
              mb-5
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Informations
          </h2>

          <div className="space-y-4">

            {/* CRÉATION */}

            <div className="flex items-start gap-3">

              <Calendar
                className="
                  mt-0.5
                  size-4
                  text-slate-400
                "
              />

              <div>

                <p className="text-xs text-slate-400">
                  Créé le
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  {formatDate(
                    projet.created_at,
                  )}
                </p>

              </div>

            </div>

            {/* MODIFICATION */}

            <div className="flex items-start gap-3">

              <Clock
                className="
                  mt-0.5
                  size-4
                  text-slate-400
                "
              />

              <div>

                <p className="text-xs text-slate-400">
                  Dernière modification
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  {formatDate(
                    projet.updated_at,
                  )}
                </p>

              </div>

            </div>

            {/* STATUT */}

            <div className="flex items-start gap-3">

              <CheckCircle2
                className="
                  mt-0.5
                  size-4
                  text-slate-400
                "
              />

              <div>

                <p className="text-xs text-slate-400">
                  Statut
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  {getStatusLabel(
                    projet.status,
                  )}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          PIÈCES JOINTES
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
          dark:bg-[#151528]
        "
      >

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          {/* TITRE */}

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                size-10
                items-center
                justify-center
                rounded-xl
                bg-[#FF6B0B]/10
              "
            >
              <Paperclip
                className="
                  size-5
                  text-[#FF6B0B]
                "
              />
            </div>

            <div>

              <h2
                className="
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Pièces jointes
              </h2>

              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                {attachments.length}{' '}
                fichier
                {attachments.length !== 1
                  ? 's'
                  : ''}{' '}
                associé
                {attachments.length !== 1
                  ? 's'
                  : ''}{' '}
                au projet
              </p>

            </div>

          </div>

          {/* AJOUT FICHIER */}

          <Button
            type="button"
            disabled={isUploading}
            onClick={() =>
              fileInputRef.current?.click()
            }
            variant="outline"
            className="
              rounded-xl
              border-[#FF6B0B]/30
              text-[#FF6B0B]
              hover:bg-[#FF6B0B]/5
            "
          >
            <Upload className="mr-2 size-4" />

            Ajouter un fichier
          </Button>

        </div>

        {/* INPUT CACHÉ */}

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />

        {/* ==================================================
            FICHIER SÉLECTIONNÉ
        ================================================== */}

        {selectedFile && (
          <div
            className="
              mt-5
              rounded-xl
              border
              border-[#FF6B0B]/20
              bg-[#FF6B0B]/5
              p-4
              dark:bg-[#FF6B0B]/10
            "
          >

            <div
              className="
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                "
              >

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
                  <FileText
                    className="
                      size-5
                      text-[#FF6B0B]
                    "
                  />
                </div>

                <div className="min-w-0">

                  <p
                    className="
                      truncate
                      text-sm
                      font-semibold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {selectedFile.name}
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-400
                    "
                  >
                    {formatFileSize(
                      selectedFile.size,
                    )}
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                <Button
                  type="button"
                  disabled={isUploading}
                  onClick={
                    handleRemoveSelectedFile
                  }
                  variant="ghost"
                  size="icon"
                  className="
                    rounded-lg
                    text-slate-400
                    hover:text-red-500
                  "
                >
                  <X className="size-4" />
                </Button>

                <Button
                  type="button"
                  disabled={isUploading}
                  onClick={
                    handleUploadAttachment
                  }
                  className="
                    rounded-xl
                    bg-[#FF6B0B]
                    font-semibold
                    text-white
                    hover:bg-[#e85f08]
                  "
                >

                  {isUploading ? (
                    <>
                      <Loader2
                        className="
                          mr-2
                          size-4
                          animate-spin
                        "
                      />

                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload
                        className="
                          mr-2
                          size-4
                        "
                      />

                      Envoyer
                    </>
                  )}

                </Button>

              </div>

            </div>

          </div>
        )}

        {/* ==================================================
            LISTE ATTACHMENTS
        ================================================== */}

        {attachments.length === 0 ? (
          <div
            className="
              mt-5
              rounded-xl
              border-2
              border-dashed
              border-slate-200
              p-10
              text-center
              dark:border-white/10
            "
          >

            <div
              className="
                mx-auto
                mb-3
                flex
                size-12
                items-center
                justify-center
                rounded-full
                bg-slate-100
                dark:bg-white/5
              "
            >
              <Paperclip
                className="
                  size-5
                  text-slate-400
                "
              />
            </div>

            <p
              className="
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
              "
            >
              Aucun fichier
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-400
              "
            >
              Ajoutez une pièce jointe au projet.
            </p>

          </div>
        ) : (
          <div className="mt-5 space-y-3">

            {attachments.map(
              (attachment) => {

                const isEditing =
                  editingAttachmentId ===
                  attachment.id

                return (
                  <div
                    key={attachment.id}
                    className="
                      flex
                      flex-col
                      gap-4
                      rounded-xl
                      border
                      border-slate-200
                      p-4
                      transition
                      hover:border-[#FF6B0B]/30
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                      dark:border-white/10
                    "
                  >

                    {/* ======================================
                        INFORMATIONS FICHIER
                    ====================================== */}

                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          size-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[#FF6B0B]/10
                        "
                      >
                        {isEditing ? (
                          <Loader2
                            className="
                              size-5
                              animate-spin
                              text-[#FF6B0B]
                            "
                          />
                        ) : (
                          <FileText
                            className="
                              size-5
                              text-[#FF6B0B]
                            "
                          />
                        )}
                      </div>

                      <div className="min-w-0">

                        <p
                          className="
                            truncate
                            text-sm
                            font-semibold
                            text-slate-900
                            dark:text-white
                          "
                        >
                          {
                            attachment.original_filename
                          }
                        </p>

                        <div
                          className="
                            mt-1
                            flex
                            flex-wrap
                            items-center
                            gap-x-3
                            gap-y-1
                            text-xs
                            text-slate-400
                          "
                        >

                          <span>
                            Ajouté le{' '}
                            {formatDate(
                              attachment.uploaded_at,
                            )}
                          </span>

                          {attachment.uploaded_by && (
                            <span>
                              Par{' '}
                              {
                                attachment.uploaded_by
                              }
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    {/* ======================================
                        ACTIONS
                    ====================================== */}

                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                      "
                    >

                      {/* MODIFIER */}

                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          isUploading
                        }
                        onClick={() =>
                          handleModifyAttachment(
                            attachment,
                          )
                        }
                        className="
                          rounded-xl
                          border-[#FF6B0B]/30
                          text-[#FF6B0B]
                          hover:bg-[#FF6B0B]/5
                        "
                      >

                        {isEditing ? (
                          <>
                            <Loader2
                              className="
                                mr-2
                                size-4
                                animate-spin
                              "
                            />

                            Modification...
                          </>
                        ) : (
                          <>
                            <Pencil
                              className="
                                mr-2
                                size-4
                              "
                            />

                            Modifier
                          </>
                        )}

                      </Button>

                      {/* OUVRIR */}

                      <a
                        href={
                          attachment.url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          border
                          border-slate-200
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-slate-700
                          transition
                          hover:border-[#FF6B0B]/30
                          hover:text-[#FF6B0B]
                          dark:border-white/10
                          dark:text-slate-200
                        "
                      >
                        <FileText className="size-4" />

                        Ouvrir
                      </a>

                    </div>

                  </div>
                )
              },
            )}

          </div>
        )}

      </div>

    </div>
  )
}

export default ProjetDetailPage