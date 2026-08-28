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
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Loader2,
  Paperclip,
  Pencil,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/context/AuthContext'
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
  date?: string | null,
): string => {
  if (!date) {
    return '—'
  }

  try {
    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    ).format(parsedDate)
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
        bg-emerald-50
        text-emerald-700
        ring-1
        ring-emerald-200
        dark:bg-emerald-500/10
        dark:text-emerald-400
        dark:ring-emerald-500/20
      `

    case 'archived':
      return `
        bg-slate-100
        text-slate-600
        ring-1
        ring-slate-200
        dark:bg-white/10
        dark:text-slate-300
        dark:ring-white/10
      `

    case 'draft':
    default:
      return `
        bg-amber-50
        text-amber-700
        ring-1
        ring-amber-200
        dark:bg-amber-500/10
        dark:text-amber-400
        dark:ring-amber-500/20
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

  const { user } = useAuth()

  /* ==========================================================
     RÔLE
  ========================================================== */

  const role = user?.role

  const isAdmin =
    role === 'admin'

  const isOrganizer =
    role === 'organizer'

  const isTrainer =
    role === 'trainer'

  const isLearner =
    role === 'learner'

  const canManageProjects =
    isAdmin ||
    isOrganizer

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

        const data =
          await projetService.getProjetById(
            projetId,
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
     SÉLECTION FICHIER
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

        const updatedProjet =
          await projetService.addAttachment(
            projet.id,
            selectedFile,
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
          '[ProjetDetailPage] Erreur upload:',
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
     MODIFIER UNE PIÈCE JOINTE
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

        await projetService.removeAttachment(
          projet.id,
          attachment.id,
        )

        const updatedProjet =
          await projetService.addAttachment(
            projet.id,
            file,
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
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FF6B0B]/10">
            <Loader2 className="size-6 animate-spin text-[#FF6B0B]" />
          </div>

          <span className="text-sm font-medium">
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
            group
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-slate-500
            transition
            hover:text-[#FF6B0B]
            dark:text-slate-400
          "
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />

          Retour aux programmes
        </button>

        <div
          className="
            rounded-3xl
            border
            border-red-200
            bg-red-50
            p-8
            dark:border-red-500/20
            dark:bg-red-500/10
          "
        >
          <div className="flex items-start gap-4">

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <X className="size-5 text-red-500" />
            </div>

            <div>

              <p className="font-bold text-red-700 dark:text-red-400">
                Projet introuvable
              </p>

              <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-300">
                {error ||
                  'Impossible de récupérer les informations du projet.'}
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  navigate('/programmes')
                }
                className="mt-5 rounded-xl"
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
          group
          flex
          items-center
          gap-2
          text-sm
          font-medium
          text-slate-500
          transition
          hover:text-[#FF6B0B]
          dark:text-slate-400
        "
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />

        Retour aux projets
      </button>

      {/* ======================================================
          VERSION APPRENANT
      ====================================================== */}

      {isLearner ? (

        <div className="space-y-6">

          {/* ==================================================
              HERO APPRENANT
          ================================================== */}

          <section
            className="
              relative
              overflow-hidden
              rounded-[2rem]
              border
              border-orange-100
              bg-gradient-to-br
              from-orange-50
              via-white
              to-amber-50
              p-6
              shadow-sm
              dark:border-orange-500/10
              dark:from-[#21171b]
              dark:via-[#151528]
              dark:to-[#211a17]
              sm:p-8
              lg:p-10
            "
          >

            {/* DÉCOR */}

            <div
              className="
                pointer-events-none
                absolute
                -right-24
                -top-24
                size-72
                rounded-full
                bg-[#FF6B0B]/10
                blur-3xl
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-32
                -left-20
                size-64
                rounded-full
                bg-amber-300/10
                blur-3xl
              "
            />

            <div className="relative">

              {/* BADGE */}

              <div className="mb-5 flex flex-wrap items-center gap-2">

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[#FF6B0B]/10
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                    text-[#FF6B0B]
                  "
                >
                  <GraduationCap className="size-3.5" />

                  Mon parcours
                </span>

                <span
                  className={`
                    inline-flex
                    items-center
                    rounded-full
                    px-3
                    py-1.5
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

              {/* TITRE */}

              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

                <div
                  className="
                    flex
                    size-16
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[#FF6B0B]
                    text-white
                    shadow-lg
                    shadow-[#FF6B0B]/20
                  "
                >
                  <BookOpen className="size-8" />
                </div>

                <div className="min-w-0">

                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Projet {projet.order}
                  </p>

                  <h1
                    className="
                      mt-1
                      text-3xl
                      font-black
                      tracking-tight
                      text-slate-900
                      dark:text-white
                      sm:text-4xl
                    "
                  >
                    {projet.title ||
                      'Projet sans titre'}
                  </h1>

                  <p
                    className="
                      mt-3
                      text-sm
                      font-medium
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    {projet.program_title ||
                      'Votre parcours de formation'}
                  </p>

                </div>

              </div>

              {/* INFOS RAPIDES */}

              <div
                className="
                  mt-8
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/70
                    bg-white/70
                    p-4
                    backdrop-blur-sm
                    dark:border-white/10
                    dark:bg-white/[0.04]
                  "
                >
                  <div className="flex items-center gap-3">

                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#FF6B0B]/10">
                      <FolderOpen className="size-4 text-[#FF6B0B]" />
                    </div>

                    <div>

                      <p className="text-[11px] font-medium text-slate-400">
                        Projet
                      </p>

                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        N° {projet.order}
                      </p>

                    </div>

                  </div>
                </div>

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/70
                    bg-white/70
                    p-4
                    backdrop-blur-sm
                    dark:border-white/10
                    dark:bg-white/[0.04]
                  "
                >
                  <div className="flex items-center gap-3">

                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </div>

                    <div>

                      <p className="text-[11px] font-medium text-slate-400">
                        Statut
                      </p>

                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {getStatusLabel(
                          projet.status,
                        )}
                      </p>

                    </div>

                  </div>
                </div>

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/70
                    bg-white/70
                    p-4
                    backdrop-blur-sm
                    dark:border-white/10
                    dark:bg-white/[0.04]
                  "
                >
                  <div className="flex items-center gap-3">

                    <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10">
                      <Paperclip className="size-4 text-blue-500" />
                    </div>

                    <div>

                      <p className="text-[11px] font-medium text-slate-400">
                        Ressources
                      </p>

                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {attachments.length}{' '}
                        fichier
                        {attachments.length !== 1
                          ? 's'
                          : ''}
                      </p>

                    </div>

                  </div>
                </div>

              </div>

            </div>

          </section>

          {/* ==================================================
              DESCRIPTION APPRENANT
          ================================================== */}

          <section
            className="
              rounded-[2rem]
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
              dark:border-white/10
              dark:bg-[#151528]
              sm:p-8
            "
          >

            <div className="flex items-start gap-4">

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
                <FileText className="size-5 text-[#FF6B0B]" />
              </div>

              <div className="min-w-0">

                <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B0B]">
                  À propos du projet
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                  Description
                </h2>

              </div>

            </div>

            <div
              className="
                mt-6
                rounded-2xl
                bg-slate-50
                p-5
                dark:bg-white/[0.03]
                sm:p-6
              "
            >

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
                  'Aucune description disponible pour ce projet.'}
              </p>

            </div>

          </section>

          {/* ==================================================
              RESSOURCES APPRENANT
          ================================================== */}

          <section
            className="
              rounded-[2rem]
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
              dark:border-white/10
              dark:bg-[#151528]
              sm:p-8
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

              <div className="flex items-start gap-4">

                <div
                  className="
                    flex
                    size-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-500/10
                  "
                >
                  <Paperclip className="size-5 text-blue-500" />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                    Ressources
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                    Documents du projet
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Consultez les fichiers mis à votre disposition.
                  </p>

                </div>

              </div>

              <span
                className="
                  w-fit
                  rounded-full
                  bg-slate-100
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-slate-600
                  dark:bg-white/[0.06]
                  dark:text-slate-300
                "
              >
                {attachments.length}{' '}
                fichier
                {attachments.length !== 1
                  ? 's'
                  : ''}
              </span>

            </div>

            {attachments.length === 0 ? (

              <div
                className="
                  mt-6
                  rounded-2xl
                  border-2
                  border-dashed
                  border-slate-200
                  bg-slate-50/50
                  p-10
                  text-center
                  dark:border-white/10
                  dark:bg-white/[0.02]
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    size-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-slate-100
                    dark:bg-white/[0.05]
                  "
                >
                  <FolderOpen className="size-6 text-slate-400" />
                </div>

                <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
                  Aucune ressource disponible
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Les documents liés à ce projet apparaîtront ici lorsqu'ils seront disponibles.
                </p>

              </div>

            ) : (

              <div
                className="
                  mt-6
                  grid
                  gap-3
                  md:grid-cols-2
                "
              >

                {attachments.map(
                  (attachment) => (
                    <div
                      key={attachment.id}
                      className="
                        group
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50/50
                        p-4
                        transition-all
                        hover:-translate-y-0.5
                        hover:border-[#FF6B0B]/30
                        hover:bg-[#FF6B0B]/[0.02]
                        hover:shadow-md
                        dark:border-white/10
                        dark:bg-white/[0.02]
                        dark:hover:border-[#FF6B0B]/30
                      "
                    >

                      <div className="flex items-center gap-3">

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
                          <FileText className="size-5 text-[#FF6B0B]" />
                        </div>

                        <div className="min-w-0 flex-1">

                          <p
                            className="
                              truncate
                              text-sm
                              font-bold
                              text-slate-900
                              dark:text-white
                            "
                            title={
                              attachment.original_filename
                            }
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
                              gap-2
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
                              <>
                                <span>•</span>

                                <span>
                                  {attachment.uploaded_by}
                                </span>
                              </>
                            )}

                          </div>

                        </div>

                        <a
                          href={
                            attachment.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir le document"
                          className="
                            flex
                            size-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-white
                            text-slate-500
                            shadow-sm
                            ring-1
                            ring-slate-200
                            transition
                            hover:bg-[#FF6B0B]
                            hover:text-white
                            hover:ring-[#FF6B0B]
                            dark:bg-white/[0.05]
                            dark:text-slate-300
                            dark:ring-white/10
                          "
                        >
                          <Download className="size-4" />
                        </a>

                      </div>

                    </div>
                  ),
                )}

              </div>

            )}

          </section>

          {/* ==================================================
              INFORMATIONS APPRENANT
          ================================================== */}

          <section
            className="
              rounded-[2rem]
              border
              border-orange-100
              bg-orange-50/60
              p-6
              dark:border-orange-500/10
              dark:bg-orange-500/5
              sm:p-8
            "
          >

            <div className="flex items-start gap-4">

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
                <GraduationCap className="size-5 text-[#FF6B0B]" />
              </div>

              <div>

                <h2 className="font-bold text-slate-900 dark:text-white">
                  Votre projet
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Prenez le temps de consulter la
                  description et les ressources
                  disponibles avant de commencer votre
                  travail.
                </p>

              </div>

            </div>

          </section>

        </div>

      ) : (

        /* ====================================================
           VERSION ADMIN / ORGANIZER / TRAINER
        ==================================================== */

        <div className="space-y-6">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
              dark:border-white/10
              dark:bg-[#151528]
              sm:p-8
            "
          >

            <div
              className="
                flex
                flex-col
                gap-6
                lg:flex-row
                lg:items-start
                lg:justify-between
              "
            >

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
                  <BookOpen className="size-7 text-[#FF6B0B]" />
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

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {projet.program_title ||
                      'Projet'}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">

                    <span className="inline-flex items-center gap-2">
                      <Clock className="size-4" />

                      Ordre :
                      <strong className="text-slate-900 dark:text-white">
                        {projet.order}
                      </strong>
                    </span>

                    {isAdmin && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        <ShieldCheck className="size-3.5" />
                        Administration
                      </span>
                    )}

                    {isOrganizer && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <Users className="size-3.5" />
                        Organisation
                      </span>
                    )}

                  </div>

                </div>

              </div>

              {canManageProjects && (
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
                    hover:bg-[#e85f08]
                  "
                >
                  <Pencil className="mr-2 size-4" />

                  Modifier
                </Button>
              )}

            </div>

          </div>

          {/* ==================================================
              INFORMATIONS
          ================================================== */}

          <div
            className="
              grid
              gap-6
              lg:grid-cols-3
            "
          >

            {/* DESCRIPTION */}

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
                  <FileText className="size-5 text-[#FF6B0B]" />
                </div>

                <div>

                  <h2 className="font-bold text-slate-900 dark:text-white">
                    Description
                  </h2>

                  <p className="text-xs text-slate-400">
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

            {/* INFORMATIONS */}

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

              <h2 className="mb-5 font-bold text-slate-900 dark:text-white">
                Informations
              </h2>

              <div className="space-y-4">

                <div className="flex items-start gap-3">

                  <Calendar className="mt-0.5 size-4 text-slate-400" />

                  <div>

                    <p className="text-xs text-slate-400">
                      Créé le
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(
                        projet.created_at,
                      )}
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <Clock className="mt-0.5 size-4 text-slate-400" />

                  <div>

                    <p className="text-xs text-slate-400">
                      Dernière modification
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(
                        projet.updated_at,
                      )}
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <CheckCircle2 className="mt-0.5 size-4 text-slate-400" />

                  <div>

                    <p className="text-xs text-slate-400">
                      Statut
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {getStatusLabel(
                        projet.status,
                      )}
                    </p>

                  </div>

                </div>

                <div className="flex items-start gap-3">

                  <FolderOpen className="mt-0.5 size-4 text-slate-400" />

                  <div>

                    <p className="text-xs text-slate-400">
                      Ordre
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      Projet N° {projet.order}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              PIÈCES JOINTES
          ================================================== */}

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
                  <Paperclip className="size-5 text-[#FF6B0B]" />
                </div>

                <div>

                  <h2 className="font-bold text-slate-900 dark:text-white">
                    Pièces jointes
                  </h2>

                  <p className="text-xs text-slate-400">
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

              {canManageProjects && (
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
              )}

            </div>

            {/* INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={
                isUploading ||
                !canManageProjects
              }
              className="hidden"
            />

            {/* FICHIER SÉLECTIONNÉ */}

            {selectedFile &&
              canManageProjects && (
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

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6B0B]/10">
                        <FileText className="size-5 text-[#FF6B0B]" />
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {selectedFile.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
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
                        className="rounded-lg text-slate-400 hover:text-red-500"
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
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Upload...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 size-4" />
                            Envoyer
                          </>
                        )}
                      </Button>

                    </div>

                  </div>

                </div>
              )}

            {/* LISTE */}

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
                  <Paperclip className="size-5 text-slate-400" />
                </div>

                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Aucun fichier
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {canManageProjects
                    ? 'Ajoutez une pièce jointe au projet.'
                    : 'Aucune pièce jointe disponible.'}
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
                              <Loader2 className="size-5 animate-spin text-[#FF6B0B]" />
                            ) : (
                              <FileText className="size-5 text-[#FF6B0B]" />
                            )}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
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

                        <div className="flex flex-wrap items-center gap-2">

                          {canManageProjects && (
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
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                  Modification...
                                </>
                              ) : (
                                <>
                                  <Pencil className="mr-2 size-4" />
                                  Modifier
                                </>
                              )}
                            </Button>
                          )}

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

          {/* ==================================================
              INFO TRAINER
          ================================================== */}

          {isTrainer && (
            <div
              className="
                rounded-2xl
                border
                border-emerald-200
                bg-emerald-50
                p-5
                dark:border-emerald-500/20
                dark:bg-emerald-500/10
              "
            >

              <div className="flex items-start gap-3">

                <Users className="mt-0.5 size-5 shrink-0 text-emerald-500" />

                <div>

                  <p className="font-semibold text-slate-900 dark:text-white">
                    Consultation des projets
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Vous pouvez consulter les projets
                    associés à ce programme. La création,
                    modification et suppression des projets
                    sont réservées aux administrateurs et
                    organisateurs.
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* ==================================================
              INFO ADMIN / ORGANIZER
          ================================================== */}

          {canManageProjects && (
            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                dark:border-white/10
                dark:bg-[#151528]
              "
            >

              <div className="flex items-start gap-3">

                <Clock className="mt-0.5 size-5 shrink-0 text-[#FF6B0B]" />

                <div>

                  <p className="font-semibold text-slate-900 dark:text-white">
                    Organisation du projet
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    L'ordre du projet définit sa position
                    dans le parcours de formation. Les
                    projets sont présentés selon leur numéro
                    d'ordre.
                  </p>

                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}

export default ProjetDetailPage

