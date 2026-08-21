import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import {
  useProgramme,
  useSession,
  useCohorte,
} from '../../hooks/useProgrammes'

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
  // DÉTECTION DES DÉTAILS
  // ─────────────────────────────────────────────

  const isProgrammeDetail =
    pathnames[0] === 'programmes' &&
    pathnames[1] &&
    pathnames[1] !== 'new'

  const programmeId = isProgrammeDetail
    ? pathnames[1]
    : undefined

  const { data: programme } =
    useProgramme(programmeId)

  const isSessionDetail =
    pathnames[0] === 'sessions' &&
    pathnames[1] &&
    pathnames[1] !== 'new'

  const sessionId = isSessionDetail
    ? pathnames[1]
    : undefined

  const { data: session } =
    useSession(sessionId)

  const isCohorteDetail =
    pathnames[0] === 'cohortes' &&
    pathnames[1] &&
    pathnames[1] !== 'new'

  const cohorteId = isCohorteDetail
    ? pathnames[1]
    : undefined

  const { data: cohorte } =
    useCohorte(cohorteId)

  // ─────────────────────────────────────────────
  // TITRES
  // ─────────────────────────────────────────────

  const getBreadcrumbTitle = (
    segment: string,
    index: number,
  ): string => {
    if (segment === 'programmes') return 'Programmes'
    if (segment === 'sessions') return 'Sessions'
    if (segment === 'cohortes') return 'Cohortes'
    if (segment === 'new') return 'Nouveau'

    if (
      index === 1 &&
      pathnames[0] === 'programmes' &&
      programme
    ) {
      return programme.nom
    }

    if (
      index === 1 &&
      pathnames[0] === 'sessions' &&
      session
    ) {
      return session.nom
    }

    if (
      index === 1 &&
      pathnames[0] === 'cohortes' &&
      cohorte
    ) {
      return cohorte.nom
    }

    return segment
  }

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs font-medium text-slate-500 dark:text-slate-400">

      {/* ═══════════════════════════════════════════
          DASHBOARD
      ═══════════════════════════════════════════ */}

      {isDashboard ? (
        // Sur le Dashboard : afficher uniquement "Dashboard"
        <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
          <Home className="size-3.5" />

          <span>
            Dashboard
          </span>
        </span>
      ) : (
        // Sur les autres pages : Dashboard est un lien
        <Link
          to="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-[#FF6B0B]"
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
          const to = `/${pathnames
            .slice(0, index + 1)
            .join('/')}`

          const isLast =
            index === pathnames.length - 1

          const title = getBreadcrumbTitle(
            value,
            index,
          )

          return (
            <React.Fragment key={to}>

              <ChevronRight
                className="
                  size-3.5
                  shrink-0
                  text-slate-400
                "
              />

              {isLast ? (
                <span
                  className="
                    max-w-[200px]
                    truncate
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
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