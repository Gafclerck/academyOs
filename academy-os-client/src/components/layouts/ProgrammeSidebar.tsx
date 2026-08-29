import React from 'react'
import {
  NavLink,
  useLocation,
} from 'react-router-dom'

import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
  Award,
  ChevronRight,
  Sparkles,
  LogOut,
  MessageSquare,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

// =====================================================
// TYPES
// =====================================================

type UserRole =
  | 'admin'
  | 'organizer'
  | 'trainer'
  | 'learner'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{
    className?: string
  }>
  description: string
  roles: UserRole[]
}

// =====================================================
// ITEMS DU SIDEBAR
// =====================================================

const SIDEBAR_ITEMS: SidebarItem[] = [
  // ===================================================
  // DASHBOARD / MON ESPACE
  // Tous les les (label adapté selon le réele)
  // ===================================================

  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: "Vue générale de l'académie",
    roles: ['admin', 'organizer', 'trainer', 'learner'],
  },

  // ===================================================
  // MA FORMATION (Apprenant)
  // ===================================================

  {
    name: 'Ma Formation',
    href: '/formations',
    icon: BookOpen,
    description: 'Mon parcours de projets',
    roles: ['learner'],
  },

  // ===================================================
  // MES CERTIFICATS (Apprenant)
  // ===================================================

  {
    name: 'Mes Certificats',
    href: '/certificats',
    icon: Award,
    description: 'Certificats obtenus',
    roles: ['learner'],
  },

  // ===================================================
  // PROGRAMMES
  // ===================================================

  {
    name: 'Programmes',
    href: '/programmes',
    icon: BookOpen,
    description: 'Offres de formation & cursus',
    roles: [
      'admin',
      'organizer',
      'trainer',
    ],
  },

  // ===================================================
  // RENTRÉES
  // ===================================================

  {
    name: 'Rentrées',
    href: '/rentrees',
    icon: CalendarDays,
    description: 'Rentrées académiques',
    roles: [
      'admin',
      'organizer',
    ],
  },

  // ===================================================
  // COHORTES
  // ===================================================

  {
    name: 'Cohortes',
    href: '/cohortes',
    icon: GraduationCap,
    description: "Groupes d'apprenants actifs",
    roles: [
      'admin',
      'organizer',
      'trainer',
    ],
  },

  // ===================================================
  // GESTION CERTIFICATS (Admin / Organisateur)
  // ===================================================

  {
    name: 'Certificats',
    href: '/gestion-certificats',
    icon: Award,
    description: "Gestion & envoi des certificats",
    roles: [
      'admin',
      'organizer',
    ],
  },
  // ===================================================
  // RÉCLAMATIONS (Admin / Organisateur)
  // ===================================================

  {
    name: 'Réclamations',
    href: '/reclamations',
    icon: MessageSquare,
    description: 'Réclamations de certificats',
    roles: [
      'admin',
      'organizer',
    ],
  },

  // ===================================================
  // UTILISATEURS
  // Admin uniquement
  // ===================================================

  {
    name: 'Utilisateurs',
    href: '/users',
    icon: Users,
    description: 'Gestion des utilisateurs',
    roles: ['admin'],
  },
]

// =====================================================
// PROPS
// =====================================================

interface ProgrammeSidebarProps {
  onCloseMobile?: () => void
}

// =====================================================
// SIDEBAR
// =====================================================

export const ProgrammeSidebar: React.FC<
  ProgrammeSidebarProps
> = ({ onCloseMobile }) => {
  const location = useLocation()

  const { logout, user } = useAuth()

  // ===================================================
  // R├öLE
  // ===================================================

  const role = user?.role as UserRole | undefined

  // ===================================================
  // ITEMS ACCESSIBLES SELON LE R├öLE
  // ===================================================

  const visibleItems = SIDEBAR_ITEMS.filter(
    (item) =>
      role !== undefined &&
      item.roles.includes(role),
  )

  // ===================================================
  // DéCONNEXION
  // ===================================================

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      onCloseMobile?.()
    }
  }

  // ===================================================
  // UTILISATEUR
  // ===================================================

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

  // ===================================================
  // PROFIL ACTIF
  // ===================================================

  const isProfileActive =
    location.pathname === '/profile'

  // ===================================================
  // LABEL DU R├öLE
  // ===================================================

  const roleLabel: Record<UserRole, string> = {
    admin: 'Administrateur',
    organizer: 'Organisateur',
    trainer: 'Formateur',
    learner: 'Apprenant',
  }

  return (
    <aside
      className="
        flex h-full w-64 flex-col
        select-none
        border-r border-slate-200
        bg-white
        dark:border-white/10
        dark:bg-[#1f1f38]
      "
    >

      {/* =========================== */}

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

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          NAVIGATION
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}

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
            Navigation
          </p>

          <nav className="space-y-1">

            {visibleItems.map((item) => {
              const Icon = item.icon

              const isLearnerOnDashboard =
                role === 'learner' && item.href === '/dashboard'

              const displayName = isLearnerOnDashboard
                ? 'Mon Espace'
                : item.name

              const displayDescription = isLearnerOnDashboard
                ? 'Ma progression personnelle'
                : item.description

              const isActive =
                item.href === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : item.href === '/programmes'
                    ? location.pathname.startsWith(
                      '/programmes',
                    )
                    : location.pathname.startsWith(
                      item.href,
                    )

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

                    ${isActive
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

                    {/* IC├öNE */}

                    <div
                      className={`
                        flex
                        size-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        transition-colors

                        ${isActive
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

                    {/* TEXTE */}

                    <div className="truncate">

                      <p className="truncate text-sm leading-tight">
                        {displayName}
                      </p>

                      <p
                        className={`
                          truncate
                          text-[10px]

                          ${isActive
                            ? 'text-white/80'
                            : 'text-slate-400 dark:text-slate-500'
                          }
                        `}
                      >
                        {displayDescription}
                      </p>

                    </div>

                  </div>

                  {/* CHEVRON */}

                  <ChevronRight
                    className={`
                      size-4
                      transition-transform

                      ${isActive
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

        {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
            WORKFLOW
        ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}

      </div>

      {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
          FOOTER / UTILISATEUR
      ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}

      <div
        className="
          space-y-2
          border-t
          border-slate-200
          p-3
          dark:border-white/10
        "
      >

        {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
            PROFIL UTILISATEUR
        ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}

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

            ${isProfileActive
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

            {role && (
              <p
                className="
                  mt-0.5
                  truncate
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-wide
                  text-[#FF6B0B]
                "
              >
                {roleLabel[role]}
              </p>
            )}

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

        {/* ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
            DéCONNEXION
        ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ */}

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
