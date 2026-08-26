import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'

import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'

/* ============================================================
   TYPES
============================================================ */

interface ProjectAttachment {
  id: string
  url: string
  original_filename: string
  uploaded_by: string
  uploaded_at: string
}

interface Project {
  id: string
  program: string
  program_title: string
  title: string
  description: string
  status: string
  order: number
  attachments: ProjectAttachment[]
  created_at: string
  updated_at: string
}

interface ProjectsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Project[]
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

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString(
    'fr-FR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  )
}

/* ============================================================
   PAGE
============================================================ */

export const ProjetListPage: React.FC = () => {
  const navigate = useNavigate()

  const { id: programmeId } =
    useParams<{ id: string }>()

  /* ============================================================
     ÉTAT
  ============================================================ */

  const [projects, setProjects] =
    useState<Project[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  /* ============================================================
     CHARGEMENT DES PROJETS
  ============================================================ */

  const loadProjects = useCallback(
    async () => {
      try {
        setLoading(true)
        setError(null)

        const response =
          await api.get<ProjectsResponse | Project[]>(
            '/projects/',
          )

        const data = response.data

        const allProjects = Array.isArray(data)
          ? data
          : data.results

        console.log(
          '📚 TOUS LES PROJETS:',
          allProjects,
        )

        /*
         * Si la page est ouverte depuis
         * /programmes/:id/projets,
         * on garde uniquement les projets
         * du programme courant.
         */
        const programmeProjects =
          programmeId
            ? allProjects.filter(
                (project) =>
                  String(project.program) ===
                  String(programmeId),
              )
            : allProjects

        console.log(
          '📚 PROJETS DU PROGRAMME:',
          programmeProjects,
        )

        setProjects(
          programmeProjects,
        )
      } catch (err) {
        console.error(
          '[ProjetListPage] Erreur chargement projets:',
          err,
        )

        setError(
          'Impossible de récupérer les projets.',
        )
      } finally {
        setLoading(false)
      }
    },
    [programmeId],
  )

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  /* ============================================================
     TRI PAR ORDRE
  ============================================================ */

  const sortedProjects =
    useMemo(
      () =>
        [...projects].sort(
          (a, b) =>
            Number(a.order) -
            Number(b.order),
        ),
      [projects],
    )

  /* ============================================================
     NOM DU PROGRAMME
  ============================================================ */

  const programmeName =
    sortedProjects[0]?.program_title ||
    'Programme'

  /* ============================================================
     SUPPRESSION
  ============================================================ */

  const handleDelete = async (
    project: Project,
  ) => {
    const confirmed =
      window.confirm(
        `Voulez-vous vraiment supprimer le projet "${project.title}" ?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(project.id)

      await api.delete(
        `/projects/${project.id}/`,
      )

      setProjects((current) =>
        current.filter(
          (item) =>
            item.id !== project.id,
        ),
      )

      toast.success(
        'Projet supprimé avec succès.',
      )
    } catch (err) {
      console.error(
        '[ProjetListPage] Erreur suppression:',
        err,
      )

      toast.error(
        'Impossible de supprimer le projet.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="size-5 animate-spin" />

          <span>
            Chargement des projets...
          </span>
        </div>
      </div>
    )
  }

  /* ============================================================
     ERREUR
  ============================================================ */

  if (error) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={() =>
            programmeId
              ? navigate(
                  `/programmes/${programmeId}`,
                )
              : navigate('/programmes')
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

          Retour au programme
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
                Impossible de charger les projets
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

              <Button
                variant="outline"
                onClick={loadProjects}
                className="mt-4 rounded-xl"
              >
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

      {/* ======================================================
          RETOUR
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          programmeId
            ? navigate(
                `/programmes/${programmeId}`,
              )
            : navigate('/programmes')
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

        Retour au programme
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          dark:border-white/10
          dark:bg-[#151528]
          sm:flex-row
          sm:items-center
          sm:justify-between
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
            <FolderOpen
              className="
                size-7
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
                sm:text-3xl
              "
            >
              Projets
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              {programmeName}
            </p>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Gérez les projets associés à ce programme.
            </p>

          </div>

        </div>

        {/* NOUVEAU PROJET */}

        <Button
          onClick={() =>
            programmeId
              ? navigate(
                  `/programmes/${programmeId}/projets/new`,
                )
              : navigate('/projets/new')
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
          "
        >
          <Plus className="mr-2 size-4" />

          Nouveau projet
        </Button>

      </div>

      {/* ======================================================
          RÉSUMÉ
      ====================================================== */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-3
        "
      >

        {/* TOTAL */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            dark:border-white/10
            dark:bg-[#151528]
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                size-11
                items-center
                justify-center
                rounded-xl
                bg-[#FF6B0B]/10
              "
            >
              <FolderOpen
                className="
                  size-5
                  text-[#FF6B0B]
                "
              />
            </div>

            <div>

              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Total projets
              </p>

              <p
                className="
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {projects.length}
              </p>

            </div>

          </div>

        </div>

        {/* PUBLIES */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            dark:border-white/10
            dark:bg-[#151528]
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                size-11
                items-center
                justify-center
                rounded-xl
                bg-emerald-500/10
              "
            >
              <BookOpen
                className="
                  size-5
                  text-emerald-500
                "
              />
            </div>

            <div>

              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Projets publiés
              </p>

              <p
                className="
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {
                  projects.filter(
                    (project) =>
                      project.status ===
                      'published',
                  ).length
                }
              </p>

            </div>

          </div>

        </div>

        {/* BROUILLONS */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            dark:border-white/10
            dark:bg-[#151528]
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                size-11
                items-center
                justify-center
                rounded-xl
                bg-amber-500/10
              "
            >
              <FileText
                className="
                  size-5
                  text-amber-500
                "
              />
            </div>

            <div>

              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Brouillons
              </p>

              <p
                className="
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {
                  projects.filter(
                    (project) =>
                      project.status ===
                      'draft',
                  ).length
                }
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          LISTE DES PROJETS
      ====================================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          dark:border-white/10
          dark:bg-[#151528]
        "
      >

        {/* HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            p-5
            dark:border-white/10
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
              <BookOpen
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
                Liste des projets
              </h2>

              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {projects.length}{' '}
                projet
                {projects.length > 1
                  ? 's'
                  : ''}{' '}
                associé
                {projects.length > 1
                  ? 's'
                  : ''}{' '}
                au programme
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            EMPTY
        ================================================== */}

        {sortedProjects.length === 0 ? (
          <div className="p-12 text-center">

            <div
              className="
                mx-auto
                flex
                size-16
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                dark:bg-white/[0.05]
              "
            >
              <FolderOpen
                className="
                  size-8
                  text-slate-400
                  dark:text-slate-500
                "
              />
            </div>

            <h3
              className="
                mt-4
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Aucun projet
            </h3>

            <p
              className="
                mx-auto
                mt-1
                max-w-md
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Aucun projet n'est encore associé
              à ce programme.
            </p>

            <Button
              onClick={() =>
                programmeId
                  ? navigate(
                      `/programmes/${programmeId}/projets/new`,
                    )
                  : navigate('/projets/new')
              }
              className="
                mt-5
                rounded-xl
                bg-[#FF6B0B]
                font-semibold
                text-white
                hover:bg-[#e85f08]
              "
            >
              <Plus className="mr-2 size-4" />

              Créer le premier projet
            </Button>

          </div>
        ) : (

          /* ==================================================
             TABLE
          ================================================== */

          <div className="overflow-x-auto">

            <table
              className="
                w-full
                min-w-[1050px]
              "
            >

              <thead>

                <tr
                  className="
                    border-b
                    border-slate-200
                    bg-slate-50/70
                    dark:border-white/10
                    dark:bg-white/[0.03]
                  "
                >

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Projet
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-center
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Ordre
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Statut
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Pièces jointes
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Créé le
                  </th>

                  <th
                    className="
                      px-5
                      py-3
                      text-right
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-200
                  dark:divide-white/10
                "
              >

                {sortedProjects.map(
                  (project) => (
                    <tr
                      key={project.id}
                      className="
                        transition
                        hover:bg-slate-50
                        dark:hover:bg-white/[0.03]
                      "
                    >

                      {/* PROJET */}

                      <td className="px-5 py-4">

                        <div className="flex items-start gap-3">

                          <div
                            className="
                              flex
                              size-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
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
                                font-semibold
                                text-slate-900
                                dark:text-white
                              "
                            >
                              {project.title ||
                                'Projet sans titre'}
                            </p>

                            <p
                              className="
                                mt-1
                                max-w-[350px]
                                truncate
                                text-xs
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              {project.description ||
                                'Aucune description'}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* ORDRE */}

                      <td className="px-5 py-4">

                        <div className="flex justify-center">

                          <span
                            className="
                              flex
                              size-9
                              items-center
                              justify-center
                              rounded-lg
                              bg-slate-100
                              text-sm
                              font-bold
                              text-slate-700
                              dark:bg-white/[0.06]
                              dark:text-slate-300
                            "
                          >
                            {project.order}
                          </span>

                        </div>

                      </td>

                      {/* STATUT */}

                      <td className="px-5 py-4">

                        <StatusBadge
                          status={
                            project.status
                          }
                        />

                      </td>

                      {/* PIÈCES JOINTES */}

                      <td className="px-5 py-4">

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <div
                            className="
                              flex
                              size-8
                              items-center
                              justify-center
                              rounded-lg
                              bg-blue-500/10
                            "
                          >
                            <FileText
                              className="
                                size-4
                                text-blue-500
                              "
                            />
                          </div>

                          <span
                            className="
                              text-sm
                              font-medium
                              text-slate-700
                              dark:text-slate-300
                            "
                          >
                            {
                              project.attachments
                                ?.length ?? 0
                            }
                          </span>

                        </div>

                      </td>

                      {/* DATE */}

                      <td
                        className="
                          px-5
                          py-4
                          text-sm
                          text-slate-600
                          dark:text-slate-300
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <Calendar
                            className="
                              size-4
                              text-slate-400
                            "
                          />

                          {formatDate(
                            project.created_at,
                          )}

                        </div>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div
                          className="
                            flex
                            justify-end
                            gap-2
                          "
                        >

                          {/* VOIR */}

                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/projets/${project.id}`,
                              )
                            }
                            className="
                              gap-1.5
                              rounded-xl
                            "
                          >
                            Voir

                            <ChevronRight
                              className="
                                size-4
                              "
                            />
                          </Button>

                          {/* MODIFIER */}

                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/projets/${project.id}/edit`,
                              )
                            }
                            className="
                              rounded-xl
                            "
                          >
                            <Pencil
                              className="
                                size-4
                              "
                            />
                          </Button>

                          {/* SUPPRIMER */}

                          <Button
                            variant="outline"
                            disabled={
                              deletingId ===
                              project.id
                            }
                            onClick={() =>
                              handleDelete(
                                project,
                              )
                            }
                            className="
                              rounded-xl
                              text-red-500
                              hover:bg-red-50
                              hover:text-red-600
                              dark:hover:bg-red-500/10
                            "
                          >
                            {deletingId ===
                            project.id ? (
                              <Loader2
                                className="
                                  size-4
                                  animate-spin
                                "
                              />
                            ) : (
                              <Trash2
                                className="
                                  size-4
                                "
                              />
                            )}
                          </Button>

                        </div>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ======================================================
          INFORMATIONS
      ====================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          dark:border-white/10
          dark:bg-[#151528]
        "
      >

        <div className="flex items-start gap-3">

          <AlertCircle
            className="
              mt-0.5
              size-5
              shrink-0
              text-[#FF6B0B]
            "
          />

          <div>

            <p
              className="
                font-semibold
                text-slate-900
                dark:text-white
              "
            >
              Organisation des projets
            </p>

            <p
              className="
                mt-1
                text-sm
                leading-6
                text-slate-500
                dark:text-slate-400
              "
            >
              L'ordre des projets définit leur
              séquence dans le parcours de formation.
              Les projets sont automatiquement triés
              selon leur numéro d'ordre.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

export default ProjetListPage