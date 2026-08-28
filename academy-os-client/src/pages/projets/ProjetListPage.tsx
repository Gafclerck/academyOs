
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
  GraduationCap,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Users,
  ClipboardList,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
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

  const { user } = useAuth()

  /* ==========================================================
     RÔLE
  ========================================================== */

  const role = user?.role

  const isAdmin = role === 'admin'
  const isOrganizer = role === 'organizer'
  const isTrainer = role === 'trainer'
  const isLearner = role === 'learner'

  /* ==========================================================
     TEXTES SELON LE RÔLE
  ========================================================== */

  const programmeDescription =
    isAdmin
      ? 'Consultez les projets associés à ce programme.'
      : isOrganizer
        ? 'Consultez les projets et leur organisation dans ce programme.'
        : isTrainer
          ? 'Consultez les projets associés à ce programme.'
          : 'Découvrez les projets de votre parcours de formation.'

  /* ==========================================================
     ÉTAT
  ========================================================== */

  const [projects, setProjects] =
    useState<Project[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  /* ==========================================================
     CHARGEMENT DES PROJETS
  ========================================================== */

  const loadProjects = useCallback(
    async () => {
      try {
        setLoading(true)
        setError(null)

        const response =
          await api.get<
            ProjectsResponse | Project[]
          >('/projects/')

        const data = response.data

        const allProjects =
          Array.isArray(data)
            ? data
            : data.results

        /*
         * Le backend reste responsable des permissions.
         *
         * Ici, on filtre simplement les projets
         * appartenant au programme affiché.
         */
        const programmeProjects =
          programmeId
            ? allProjects.filter(
                (project) =>
                  String(project.program) ===
                  String(programmeId),
              )
            : allProjects

        setProjects(programmeProjects)
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

  /* ==========================================================
     TRI DES PROJETS
  ========================================================== */

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

  /* ==========================================================
     NOM DU PROGRAMME
  ========================================================== */

  const programmeName =
    sortedProjects[0]?.program_title ||
    'Programme'

  /* ==========================================================
     STATISTIQUES
  ========================================================== */

  const publishedProjects =
    projects.filter(
      (project) =>
        project.status === 'published',
    ).length

  const draftProjects =
    projects.filter(
      (project) =>
        project.status === 'draft',
    ).length

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const handleBack = () => {
    if (programmeId) {
      navigate(
        `/programmes/${programmeId}`,
      )
      return
    }

    navigate('/programmes')
  }

  const handleViewProject = (
    projectId: string,
  ) => {
    if (programmeId) {
      navigate(
        `/programmes/${programmeId}/projets/${projectId}`,
      )
      return
    }

    navigate('/programmes')
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[500px]
          items-center
          justify-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
            text-center
          "
        >
          <div
            className="
              flex
              size-12
              items-center
              justify-center
              rounded-2xl
              bg-[#FF6B0B]/10
            "
          >
            <Loader2
              className="
                size-6
                animate-spin
                text-[#FF6B0B]
              "
            />
          </div>

          <div>
            <p
              className="
                font-semibold
                text-slate-900
                dark:text-white
              "
            >
              {isLearner
                ? 'Chargement de vos projets...'
                : 'Chargement des projets...'}
            </p>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Veuillez patienter quelques instants.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ==========================================================
     ERREUR
  ========================================================== */

  if (error) {
    return (
      <div className="space-y-6">

        <button
          type="button"
          onClick={handleBack}
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
          <ArrowLeft
            className="
              size-4
              transition-transform
              group-hover:-translate-x-1
            "
          />

          Retour au programme
        </button>

        <div
          className="
            rounded-3xl
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
                  leading-6
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
        onClick={handleBack}
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
        <ArrowLeft
          className="
            size-4
            transition-transform
            group-hover:-translate-x-1
          "
        />

        Retour au programme
      </button>

      {/* ======================================================
          HEADER LEARNER
      ====================================================== */}

      {isLearner ? (

        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-orange-100
            bg-gradient-to-br
            from-orange-50
            via-white
            to-amber-50
            p-6
            shadow-sm
            dark:border-orange-500/10
            dark:from-[#21191a]
            dark:via-[#1f1f38]
            dark:to-[#21191a]
            sm:p-8
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              size-56
              rounded-full
              bg-[#FF6B0B]/10
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-20
              -left-20
              size-48
              rounded-full
              bg-amber-400/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-6
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div className="flex items-start gap-4">

              <div
                className="
                  flex
                  size-16
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#FF6B0B]/10
                  ring-1
                  ring-[#FF6B0B]/10
                "
              >
                <GraduationCap
                  className="
                    size-8
                    text-[#FF6B0B]
                  "
                />
              </div>

              <div>

                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-[#FF6B0B]
                  "
                >
                  Mon parcours
                </p>

                <h1
                  className="
                    mt-1
                    text-2xl
                    font-extrabold
                    tracking-tight
                    text-slate-900
                    dark:text-white
                    sm:text-3xl
                  "
                >
                  Mes projets
                </h1>

                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  {programmeName}
                </p>

                <p
                  className="
                    mt-2
                    max-w-xl
                    text-sm
                    leading-6
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {programmeDescription}
                </p>

              </div>

            </div>

            <div
              className="
                flex
                w-fit
                items-center
                gap-3
                rounded-2xl
                border
                border-orange-100
                bg-white/80
                px-4
                py-3
                backdrop-blur-sm
                dark:border-white/10
                dark:bg-white/[0.05]
              "
            >

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
                <ClipboardList
                  className="
                    size-5
                    text-[#FF6B0B]
                  "
                />
              </div>

              <div>

                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Parcours
                </p>

                <p
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {projects.length}{' '}
                  {projects.length > 1
                    ? 'projets'
                    : 'projet'}
                </p>

              </div>

            </div>

          </div>

        </div>

      ) : (

        /* ====================================================
           HEADER ADMIN / ORGANIZER / TRAINER
        ==================================================== */

        <div
          className="
            flex
            flex-col
            gap-5
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-white/10
            dark:bg-[#1f1f38]
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:p-8
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

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >

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

                {isAdmin && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-purple-500/10
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-purple-600
                      dark:text-purple-400
                    "
                  >
                    <ShieldCheck className="size-3.5" />
                    Administration
                  </span>
                )}

                {isOrganizer && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-blue-500/10
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-blue-600
                      dark:text-blue-400
                    "
                  >
                    <Users className="size-3.5" />
                    Organisation
                  </span>
                )}

                {isTrainer && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-emerald-500/10
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-emerald-600
                      dark:text-emerald-400
                    "
                  >
                    <GraduationCap className="size-3.5" />
                    Formateur
                  </span>
                )}

              </div>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {programmeName}
              </p>

              <p
                className="
                  mt-1
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {programmeDescription}
              </p>

            </div>

          </div>

          {/* Aucun bouton de création */}
        </div>
      )}

      {/* ======================================================
          STATISTIQUES ADMIN / ORGANIZER
      ====================================================== */}

      {(isAdmin || isOrganizer) && (

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
              shadow-sm
              dark:border-white/10
              dark:bg-[#1f1f38]
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

          {/* PUBLIÉS */}

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              dark:border-white/10
              dark:bg-[#1f1f38]
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
                  {publishedProjects}
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
              shadow-sm
              dark:border-white/10
              dark:bg-[#1f1f38]
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
                  {draftProjects}
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          MESSAGE TRAINER
      ====================================================== */}

      {isTrainer && (

        <div
          className="
            flex
            items-start
            gap-4
            rounded-2xl
            border
            border-emerald-200
            bg-emerald-50
            p-5
            dark:border-emerald-500/20
            dark:bg-emerald-500/10
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
              bg-emerald-500/10
            "
          >
            <Users
              className="
                size-5
                text-emerald-500
              "
            />
          </div>

          <div>

            <p
              className="
                font-semibold
                text-slate-900
                dark:text-white
              "
            >
              Projets du programme
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
              Vous pouvez consulter les projets
              associés à ce programme.
            </p>

          </div>

        </div>
      )}

      {/* ======================================================
          CONTENU LEARNER
      ====================================================== */}

      {isLearner ? (

        <div className="space-y-5">

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >

            <div>

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
                  <ClipboardList
                    className="
                      size-5
                      text-[#FF6B0B]
                    "
                  />
                </div>

                <div>

                  <h2
                    className="
                      text-lg
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Projets du parcours
                  </h2>

                  <p
                    className="
                      text-sm
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Réalisez les projets dans l'ordre
                    prévu par votre formation.
                  </p>

                </div>

              </div>

            </div>

            <div
              className="
                flex
                w-fit
                items-center
                gap-2
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
              <FolderOpen className="size-3.5" />

              {projects.length}{' '}
              {projects.length > 1
                ? 'projets'
                : 'projet'}
            </div>

          </div>

          {sortedProjects.length === 0 ? (

            <div
              className="
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-12
                text-center
                shadow-sm
                dark:border-white/10
                dark:bg-[#1f1f38]
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  size-20
                  items-center
                  justify-center
                  rounded-3xl
                  bg-[#FF6B0B]/10
                "
              >
                <GraduationCap
                  className="
                    size-9
                    text-[#FF6B0B]
                  "
                />
              </div>

              <h3
                className="
                  mt-5
                  text-lg
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Aucun projet disponible
              </h3>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Aucun projet n'est actuellement
                disponible dans votre parcours.
                Revenez plus tard pour découvrir
                les prochains projets.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              "
            >

              {sortedProjects.map(
                (project, index) => {

                  const projectNumber =
                    Number(project.order) ||
                    index + 1

                  const attachmentsCount =
                    project.attachments?.length ??
                    0

                  return (
                    <div
                      key={project.id}
                      className="
                        group
                        relative
                        overflow-hidden
                        rounded-3xl
                        border
                        border-slate-200
                        bg-white
                        shadow-sm
                        transition-all
                        duration-300
                        hover:-translate-y-1
                        hover:border-[#FF6B0B]/30
                        hover:shadow-xl
                        hover:shadow-[#FF6B0B]/5
                        dark:border-white/10
                        dark:bg-[#1f1f38]
                        dark:hover:border-[#FF6B0B]/30
                      "
                    >

                      <div
                        className="
                          absolute
                          inset-x-0
                          top-0
                          h-1
                          bg-[#FF6B0B]
                          opacity-70
                          transition
                          group-hover:opacity-100
                        "
                      />

                      <div className="p-6">

                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-4
                          "
                        >

                          <div
                            className="
                              flex
                              size-14
                              shrink-0
                              items-center
                              justify-center
                              rounded-2xl
                              bg-[#FF6B0B]/10
                              text-base
                              font-extrabold
                              text-[#FF6B0B]
                              transition
                              group-hover:bg-[#FF6B0B]
                              group-hover:text-white
                            "
                          >
                            {String(
                              projectNumber,
                            ).padStart(2, '0')}
                          </div>

                          <StatusBadge
                            status={
                              project.status
                            }
                          />

                        </div>

                        <div className="mt-5">

                          <p
                            className="
                              text-[11px]
                              font-bold
                              uppercase
                              tracking-[0.16em]
                              text-[#FF6B0B]
                            "
                          >
                            Projet{' '}
                            {String(
                              projectNumber,
                            ).padStart(2, '0')}
                          </p>

                          <h3
                            className="
                              mt-1.5
                              min-h-[56px]
                              line-clamp-2
                              text-lg
                              font-extrabold
                              leading-7
                              text-slate-900
                              dark:text-white
                            "
                          >
                            {project.title ||
                              'Projet sans titre'}
                          </h3>

                          <p
                            className="
                              mt-3
                              min-h-[72px]
                              line-clamp-3
                              text-sm
                              leading-6
                              text-slate-500
                              dark:text-slate-400
                            "
                          >
                            {project.description ||
                              'Aucune description disponible pour ce projet.'}
                          </p>

                        </div>

                        <div
                          className="
                            mt-5
                            grid
                            grid-cols-2
                            gap-3
                            border-t
                            border-slate-100
                            pt-4
                            dark:border-white/10
                          "
                        >

                          <div
                            className="
                              flex
                              min-w-0
                              items-center
                              gap-2
                            "
                          >

                            <div
                              className="
                                flex
                                size-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-slate-100
                                dark:bg-white/[0.06]
                              "
                            >
                              <Calendar
                                className="
                                  size-4
                                  text-slate-500
                                  dark:text-slate-400
                                "
                              />
                            </div>

                            <div className="min-w-0">

                              <p
                                className="
                                  text-[9px]
                                  font-bold
                                  uppercase
                                  tracking-wider
                                  text-slate-400
                                "
                              >
                                Disponible
                              </p>

                              <p
                                className="
                                  truncate
                                  text-xs
                                  font-semibold
                                  text-slate-700
                                  dark:text-slate-300
                                "
                              >
                                {formatDate(
                                  project.created_at,
                                )}
                              </p>

                            </div>

                          </div>

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
                                shrink-0
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

                            <div>

                              <p
                                className="
                                  text-[9px]
                                  font-bold
                                  uppercase
                                  tracking-wider
                                  text-slate-400
                                "
                              >
                                Ressources
                              </p>

                              <p
                                className="
                                  text-xs
                                  font-semibold
                                  text-slate-700
                                  dark:text-slate-300
                                "
                              >
                                {attachmentsCount}{' '}
                                {attachmentsCount > 1
                                  ? 'fichiers'
                                  : 'fichier'}
                              </p>

                            </div>

                          </div>

                        </div>

                        <Button
                          onClick={() =>
                            handleViewProject(
                              project.id,
                            )
                          }
                          className="
                            mt-5
                            w-full
                            rounded-xl
                            bg-slate-900
                            font-semibold
                            text-white
                            transition-all
                            group-hover:bg-[#FF6B0B]
                            dark:bg-white/[0.08]
                            dark:text-white
                            dark:group-hover:bg-[#FF6B0B]
                          "
                        >
                          Consulter le projet

                          <ChevronRight
                            className="
                              ml-2
                              size-4
                              transition-transform
                              group-hover:translate-x-1
                            "
                          />
                        </Button>

                      </div>

                    </div>
                  )
                },
              )}

            </div>
          )}

        </div>

      ) : (

        /* ======================================================
           CONTENU ADMIN / ORGANIZER / TRAINER
        ====================================================== */

        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-[#1f1f38]
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              gap-3
              border-b
              border-slate-200
              p-5
              dark:border-white/10
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
                {isTrainer ? (
                  <GraduationCap
                    className="
                      size-5
                      text-[#FF6B0B]
                    "
                  />
                ) : (
                  <BookOpen
                    className="
                      size-5
                      text-[#FF6B0B]
                    "
                  />
                )}
              </div>

              <div>

                <h2
                  className="
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {isTrainer
                    ? 'Projets du programme'
                    : 'Liste des projets'}
                </h2>

                <p
                  className="
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {isTrainer
                    ? 'Consultez les projets associés à ce programme.'
                    : `${projects.length} projet${projects.length > 1 ? 's' : ''} associé${projects.length > 1 ? 's' : ''} au programme.`}
                </p>

              </div>

            </div>

            <div
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
              {projects.length}{' '}
              {projects.length > 1
                ? 'projets'
                : 'projet'}
            </div>

          </div>

          {/* EMPTY */}

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
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Aucun projet n'est encore associé
                à ce programme.
              </p>

            </div>

          ) : (

            /* =================================================
               TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table
                className="
                  w-full
                  min-w-[800px]
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
                      Action
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
                          group
                          transition
                          hover:bg-slate-50
                          dark:hover:bg-white/[0.03]
                        "
                      >

                        {/* PROJET */}

                        <td className="px-5 py-5">

                          <div className="flex items-start gap-3">

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
                                  max-w-[380px]
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

                        <td className="px-5 py-5">

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

                        <td className="px-5 py-5">

                          <StatusBadge
                            status={
                              project.status
                            }
                          />

                        </td>

                        {/* PIÈCES JOINTES */}

                        <td className="px-5 py-5">

                          <div className="flex items-center gap-2">

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
                              {project.attachments
                                ?.length ?? 0}
                            </span>

                          </div>

                        </td>

                        {/* DATE */}

                        <td
                          className="
                            px-5
                            py-5
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

                        {/* ACTION */}

                        <td className="px-5 py-5">

                          <div
                            className="
                              flex
                              justify-end
                            "
                          >

                            <Button
                              variant="outline"
                              onClick={() =>
                                handleViewProject(
                                  project.id,
                                )
                              }
                              className="
                                gap-1.5
                                rounded-xl
                                font-semibold
                                transition
                                group-hover:border-[#FF6B0B]/30
                                group-hover:text-[#FF6B0B]
                              "
                            >
                              Voir

                              <ChevronRight
                                className="size-4"
                              />
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
      )}

      {/* ======================================================
          INFORMATIONS ADMIN / ORGANIZER
      ====================================================== */}

      {(isAdmin || isOrganizer) && (

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-white/10
            dark:bg-[#1f1f38]
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
      )}

      {/* ======================================================
          INFORMATIONS TRAINER
      ====================================================== */}

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

            <Users
              className="
                mt-0.5
                size-5
                shrink-0
                text-emerald-500
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
                Consultation des projets
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
                Vous pouvez consulter les projets
                associés à ce programme.
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          INFORMATIONS LEARNER
      ====================================================== */}

      {isLearner && (

        <div
          className="
            rounded-2xl
            border
            border-orange-100
            bg-orange-50/70
            p-5
            dark:border-orange-500/10
            dark:bg-orange-500/5
          "
        >

          <div className="flex items-start gap-3">

            <GraduationCap
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
                Votre parcours de projets
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
                Les projets sont présentés dans l'ordre
                prévu par votre parcours de formation.
                Sélectionnez un projet pour consulter
                ses détails et les ressources disponibles.
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default ProjetListPage
