
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

import { useProgramme } from '@/hooks/useProgrammes'

import { useRentree } from '@/hooks/rentrees/useRentree'
import { useCohorte } from '@/hooks/cohortes/useCohortes'
import { useProjet } from '@/hooks/useProjets'

export const ProgrammeBreadcrumbs: React.FC = () => {
  const location = useLocation()

  const pathnames = location.pathname
    .split('/')
    .filter((x) => x)

  // ─────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────

  const isDashboard =
    location.pathname === '/dashboard'

  // ─────────────────────────────────────────────
  // PROGRAMME
  // ─────────────────────────────────────────────

  const isProgrammeDetail =
    pathnames[0] === 'programmes' &&
    !!pathnames[1] &&
    pathnames[1] !== 'new'

  const programmeId = isProgrammeDetail
    ? pathnames[1]
    : undefined

  const { data: programme } =
    useProgramme(programmeId)

  // ─────────────────────────────────────────────
  // COHORTE
  // ─────────────────────────────────────────────

  const isCohorteDetail =
    pathnames[0] === 'cohortes' &&
    !!pathnames[1] &&
    pathnames[1] !== 'new'

  const cohorteId = isCohorteDetail
    ? pathnames[1]
    : undefined

  const { data: cohorte } =
    useCohorte(cohorteId)

  // ─────────────────────────────────────────────
  // RENTRÉE
  // ─────────────────────────────────────────────

  const isRentreeDetail =
    pathnames[0] === 'rentrees' &&
    !!pathnames[1] &&
    pathnames[1] !== 'new'

  const rentreeId = isRentreeDetail
    ? pathnames[1]
    : undefined

  const { data: rentree } =
    useRentree(rentreeId)

  // ─────────────────────────────────────────────
  // PROJET (imbriqué sous /programmes/:id/projets)
  // ─────────────────────────────────────────────

  const isProjetSection =
    pathnames[0] === 'programmes' &&
    pathnames[2] === 'projets'

  const isProjetDetail =
    isProjetSection &&
    !!pathnames[3] &&
    pathnames[3] !== 'new'

  const projetId = isProjetDetail
    ? pathnames[3]
    : undefined

  const { data: projet } =
    useProjet(projetId)

  // ─────────────────────────────────────────────
  // TITRES
  // ─────────────────────────────────────────────

  const getBreadcrumbTitle = (
    segment: string,
    index: number,
  ): string => {

    // ─────────────────────────────────────────────
    // NIVEAUX PRINCIPAUX
    // ─────────────────────────────────────────────

    if (segment === 'programmes') {
      return 'Programmes'
    }

    if (segment === 'cohortes') {
      return 'Cohortes'
    }

    if (segment === 'rentrees') {
      return 'Rentrées'
    }

    if (segment === 'projets') {
      return 'Projets'
    }

    if (segment === 'new') {
      return 'Nouveau'
    }

    // ─────────────────────────────────────────────
    // DÉTAIL PROGRAMME
    // ─────────────────────────────────────────────

    if (
      index === 1 &&
      pathnames[0] === 'programmes' &&
      programme
    ) {
      return programme.nom
    }

    // ─────────────────────────────────────────────
    // DÉTAIL COHORTE
    // ─────────────────────────────────────────────

    if (
      index === 1 &&
      pathnames[0] === 'cohortes' &&
      cohorte
    ) {
      return cohorte.name
    }

    // ─────────────────────────────────────────────
    // DÉTAIL RENTRÉE
    // ─────────────────────────────────────────────

    if (
      index === 1 &&
      pathnames[0] === 'rentrees' &&
      rentree
    ) {
      return rentree.name
    }

    // ─────────────────────────────────────────────
    // DÉTAIL PROJET
    // ─────────────────────────────────────────────

    if (
      index === 3 &&
      pathnames[2] === 'projets' &&
      projet
    ) {
      return projet.title
    }

    // ─────────────────────────────────────────────
    // FALLBACK
    // ─────────────────────────────────────────────

    return segment
  }

  // ─────────────────────────────────────────────
  // CONSTRUCTION DU LIEN
  // ─────────────────────────────────────────────

  const getBreadcrumbPath = (
    index: number,
  ): string => {

    /*
     * Cas spécial :
     *
     * URL actuelle :
     * /programmes/:programId/projets/:projetId
     *
     * Le segment "projets" (index 2) doit retourner vers :
     * /programmes/:programId/projets
     *
     * et non vers :
     * /programmes/:programId/projets/:projetId
     */

    if (
      pathnames[0] === 'programmes' &&
      pathnames[2] === 'projets' &&
      index === 2
    ) {
      return `/programmes/${pathnames[1]}/projets`
    }

    return `/${pathnames
      .slice(0, index + 1)
      .join('/')}`
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <nav
      className="
        flex
        items-center
        gap-1.5
        overflow-x-auto
        py-1
        text-xs
        font-medium
        text-slate-500
        dark:text-slate-400
      "
    >

      {/* ═══════════════════════════════════════════
          DASHBOARD
      ═══════════════════════════════════════════ */}

      {isDashboard ? (
        <span
          className="
            flex
            items-center
            gap-1
            font-semibold
            text-slate-900
            dark:text-white
          "
        >
          <Home className="size-3.5" />

          <span>
            Dashboard
          </span>
        </span>
      ) : (
        <Link
          to="/dashboard"
          className="
            flex
            items-center
            gap-1
            transition-colors
            hover:text-[#FF6B0B]
          "
        >
          <Home className="size-3.5" />

          <span className="hidden sm:inline">
            Dashboard
          </span>
        </Link>
      )}

      {/* ═══════════════════════════════════════════
          AUTRES NIVEAUX
      ═══════════════════════════════════════════ */}

      {!isDashboard &&
        pathnames.map((value, index) => {

          const to =
            getBreadcrumbPath(index)

          const isLast =
            index === pathnames.length - 1

          const title =
            getBreadcrumbTitle(
              value,
              index,
            )

          return (
            <React.Fragment key={`${to}-${index}`}>

              {/* SÉPARATEUR */}

              <ChevronRight
                className="
                  size-3.5
                  shrink-0
                  text-slate-400
                "
              />

              {/* DERNIER ÉLÉMENT */}

              {isLast ? (
                <span
                  className="
                    max-w-[200px]
                    truncate
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                  title={title}
                >
                  {title}
                </span>
              ) : (
                <Link
                  to={to}
                  className="
                    max-w-[180px]
                    truncate
                    transition-colors
                    hover:text-[#FF6B0B]
                  "
                  title={title}
                >
                  {title}
                </Link>
              )}

            </React.Fragment>
          )
        })}
    </nav>
  )
}

export default ProgrammeBreadcrumbs

