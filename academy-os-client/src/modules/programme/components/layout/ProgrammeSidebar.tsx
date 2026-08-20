import React from 'react'
import {
  NavLink,
  useLocation,
} from 'react-router-dom'

import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  FolderGit2,
  Users,
  ChevronRight,
  Sparkles,
  LogOut,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{
    className?: string
  }>
  description: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    name: 'Programmes',
    href: '/programmes',
    icon: BookOpen,
    description: 'Offres de formation & cursus',
  },
  {
    name: 'Rentrées',
    href: '/rentrees',
    icon: CalendarDays,
    description: 'Rentrées académiques',
  },
  {
    name: 'Cohortes',
    href: '/cohortes',
    icon: GraduationCap,
    description: "Groupes d'apprenants actifs",
  },
  {
    name: 'Projets',
    href: '/projets',
    icon: FolderGit2,
    description: 'Suivi des livrables & jalons',
  },
  {
    name: 'Utilisateurs',
    href: '/users',
    icon: Users,
    description: 'Gestion des utilisateurs',
  },
]

interface ProgrammeSidebarProps {
  onCloseMobile?: () => void
}

export const ProgrammeSidebar: React.FC<
  ProgrammeSidebarProps
> = ({ onCloseMobile }) => {
  const location = useLocation()

  const { logout, user } = useAuth()

  // ─────────────────────────────────────────────
  // DÉCONNEXION
  // ─────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      onCloseMobile?.()
    }
  }

  // ─────────────────────────────────────────────
  // UTILISATEUR
  // ─────────────────────────────────────────────

  const userInitials =
    user?.first_name && user?.last_name
      ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
      : 'XP'

  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : 'Utilisateur'

  const userEmail =
    user?.email || 'admin@xarala.co'

  const isProfileActive =
    location.pathname === '/profile'

  return (
    <aside
      className="
        flex h-full w-64 flex-col
        select-none
        border-r border-slate-200
        bg-white
        dark:border-white/10
        dark:bg-[#151528]
      "
    >

      {/* ═══════════════════════════════════════════
          LOGO
      ═══════════════════════════════════════════ */}

      <div
        className="
          flex h-16 items-center gap-3
          border-b border-slate-200
          px-5
          dark:border-white/10
        "
      >
        <div
          className="
            flex size-9
            items-center justify-center
            rounded-xl
            bg-gradient-to-br
            from-[#FF6B0B]
            to-[#FF8C38]
            text-white
            shadow-md
            shadow-[#FF6B0B]/20
          "
        >
          <Sparkles className="size-5" />
        </div>

        <div>
          <span
            className="
              flex items-center gap-1.5
              text-base font-extrabold
              tracking-tight
              text-slate-900
              dark:text-white
            "
          >
            Xarala

            <span className="font-black text-[#FF6B0B]">
              OS
            </span>
          </span>

          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
              dark:text-slate-500
            "
          >
            Academy Management
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════ */}

      <div
        className="
          flex-1
          space-y-6
          overflow-y-auto
          px-3
          py-5
        "
      >

        <div>

          <p
            className="
              mb-2
              px-3
              text-[11px]
              font-bold
              uppercase
              tracking-wider
              text-slate-400
              dark:text-slate-500
            "
          >
            Hiérarchie Métier
          </p>

          <nav className="space-y-1">

            {SIDEBAR_ITEMS.map((item, index) => {
              const Icon = item.icon

              const isActive =
                item.href === '/programmes'
                  ? location.pathname.startsWith('/programmes')
                  : location.pathname.startsWith(item.href)

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={`
                    group
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                    transition-all

                    ${
                      isActive
                        ? `
                          bg-[#FF6B0B]
                          font-semibold
                          text-white
                          shadow-md
                          shadow-[#FF6B0B]/25
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-100
                          hover:text-slate-900

                          dark:text-slate-300
                          dark:hover:bg-white/5
                          dark:hover:text-white
                        `
                    }
                  `}
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
                      className={`
                        flex
                        size-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        transition-colors

                        ${
                          isActive
                            ? `
                              bg-white/20
                              text-white
                            `
                            : `
                              bg-slate-100
                              text-slate-500

                              group-hover:bg-[#FF6B0B]/10
                              group-hover:text-[#FF6B0B]

                              dark:bg-white/5
                              dark:text-slate-400
                            `
                        }
                      `}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="truncate">

                      <p className="truncate text-sm leading-tight">
                        {item.name}
                      </p>

                      <p
                        className={`
                          truncate
                          text-[10px]

                          ${
                            isActive
                              ? 'text-white/80'
                              : 'text-slate-400 dark:text-slate-500'
                          }
                        `}
                      >
                        Niveau {index + 1}
                      </p>

                    </div>

                  </div>

                  <ChevronRight
                    className={`
                      size-4
                      transition-transform

                      ${
                        isActive
                          ? `
                            text-white
                            opacity-80
                          `
                          : `
                            text-slate-300
                            opacity-0

                            group-hover:translate-x-0.5
                            group-hover:opacity-100

                            dark:text-slate-600
                          `
                      }
                    `}
                  />

                </NavLink>
              )
            })}

          </nav>

        </div>

        {/* ═══════════════════════════════════════════
            WORKFLOW
        ═══════════════════════════════════════════ */}

        <div
          className="
            space-y-2
            rounded-xl
            border
            border-slate-200/80
            bg-slate-50
            p-3.5

            dark:border-white/5
            dark:bg-white/[0.02]
          "
        >

          <p
            className="
              text-xs
              font-bold
              text-slate-900
              dark:text-white
            "
          >
            Architecture P-R-C-P
          </p>

          <div
            className="
              flex
              items-center
              gap-1.5
              text-[11px]
              font-semibold
              text-slate-500
              dark:text-slate-400
            "
          >
            <span className="text-[#FF6B0B]">
              Prog
            </span>

            <span>→</span>

            <span>Rentrée</span>

            <span>→</span>

            <span>Coh</span>

            <span>→</span>

            <span>Proj</span>
          </div>

          <p
            className="
              text-[11px]
              leading-relaxed
              text-slate-500
              dark:text-slate-400
            "
          >
            Créez une rentrée depuis un programme,
            puis rattachez-y vos cohortes.
          </p>

        </div>

      </div>

      {/* ═══════════════════════════════════════════
          FOOTER / UTILISATEUR
      ═══════════════════════════════════════════ */}

      <div
        className="
          space-y-2
          border-t
          border-slate-200
          p-3
          dark:border-white/10
        "
      >

        {/* ═══════════════════════════════════════════
            PROFIL UTILISATEUR
            Nom + email cliquables
        ═══════════════════════════════════════════ */}

        <NavLink
          to="/profile"
          onClick={onCloseMobile}
          className={`
            group
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            p-2
            text-left
            transition-all

            ${
              isProfileActive
                ? `
                  bg-[#FF6B0B]/10
                  ring-1
                  ring-[#FF6B0B]/20
                `
                : `
                  bg-slate-50
                  hover:bg-[#FF6B0B]/5

                  dark:bg-white/[0.03]
                  dark:hover:bg-white/[0.06]
                `
            }
          `}
          aria-label="Consulter mon profil"
        >

          {/* AVATAR */}

          <div
            className="
              flex
              size-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#FF6B0B]/15
              text-xs
              font-bold
              text-[#FF6B0B]
              transition-transform
              duration-200
              group-hover:scale-105
            "
          >
            {userInitials}
          </div>

          {/* NOM + EMAIL */}

          <div className="min-w-0 flex-1">

            <p
              className="
                truncate
                text-xs
                font-semibold
                text-slate-900
                dark:text-white
              "
            >
              {userName}
            </p>

            <p
              className="
                truncate
                text-[10px]
                text-slate-500
                dark:text-slate-400
              "
            >
              {userEmail}
            </p>

          </div>

          {/* CHEVRON */}

          <ChevronRight
            className="
              size-4
              shrink-0
              text-slate-300
              opacity-0
              transition-all
              duration-200
              group-hover:translate-x-0.5
              group-hover:opacity-100
              dark:text-slate-600
            "
          />

        </NavLink>

        {/* ═══════════════════════════════════════════
            LOGOUT
        ═══════════════════════════════════════════ */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            group
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-2.5
            text-sm
            font-medium
            text-red-500
            transition-all

            hover:bg-red-50
            hover:text-red-600

            dark:text-red-400
            dark:hover:bg-red-500/10
            dark:hover:text-red-300
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
              bg-red-500/10
              text-red-500
              transition-colors

              group-hover:bg-red-500/15

              dark:text-red-400
            "
          >
            <LogOut className="size-4" />
          </div>

          <span>
            Se déconnecter
          </span>

        </button>

      </div>

    </aside>
  )
}

export default ProgrammeSidebar

