import React from 'react'
import {
  Users,
  BookOpen,
  GraduationCap,
  FolderGit2,
  UserPlus,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock3,
  CheckCircle2,
  CalendarDays,
  Activity,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const firstName = user?.first_name || 'Administrateur'

  // ─────────────────────────────────────────────
  // STATISTIQUES TEMPORAIRES
  // À remplacer ensuite par les données API
  // ─────────────────────────────────────────────

  const statistics = [
    {
      title: 'Utilisateurs',
      value: '128',
      change: '+12%',
      trend: 'up' as const,
      description: 'ce mois-ci',
      icon: Users,
      href: '/users',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Programmes',
      value: '12',
      change: '+2',
      trend: 'up' as const,
      description: 'ce mois-ci',
      icon: BookOpen,
      href: '/programmes',
      iconBg: 'bg-[#FF6B0B]/10',
      iconColor: 'text-[#FF6B0B]',
    },
    {
      title: 'Cohortes',
      value: '18',
      change: '+4',
      trend: 'up' as const,
      description: 'actives',
      icon: GraduationCap,
      href: '/cohortes',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'Projets',
      value: '34',
      change: '+8%',
      trend: 'up' as const,
      description: 'ce mois-ci',
      icon: FolderGit2,
      href: '/projets',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
  ]

  // ─────────────────────────────────────────────
  // UTILISATEURS RÉCENTS
  // ─────────────────────────────────────────────

  const recentUsers = [
    {
      name: 'Fatou Sow',
      email: 'fatou.sow@xarala.co',
      role: 'Apprenant',
      date: 'Aujourd’hui',
      initials: 'FS',
    },
    {
      name: 'Moussa Diop',
      email: 'moussa.diop@xarala.co',
      role: 'Formateur',
      date: 'Hier',
      initials: 'MD',
    },
    {
      name: 'Awa Ndiaye',
      email: 'awa.ndiaye@xarala.co',
      role: 'Apprenant',
      date: 'Il y a 2 jours',
      initials: 'AN',
    },
    {
      name: 'Ibrahima Fall',
      email: 'ibrahima.fall@xarala.co',
      role: 'Administrateur',
      date: 'Il y a 3 jours',
      initials: 'IF',
    },
  ]

  // ─────────────────────────────────────────────
  // ACTIVITÉS RÉCENTES
  // ─────────────────────────────────────────────

  const activities = [
    {
      title: 'Nouvelle cohorte créée',
      description: 'Développement Web - Cohorte 12',
      time: 'Il y a 20 min',
      icon: GraduationCap,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'Nouvel utilisateur ajouté',
      description: 'Fatou Sow a été ajoutée',
      time: 'Il y a 1 h',
      icon: UserPlus,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Projet terminé',
      description: 'Application de gestion des congés',
      time: 'Il y a 3 h',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Rentrée programmée',
      description: 'Rentrée Septembre 2026',
      time: 'Hier',
      icon: CalendarDays,
      iconBg: 'bg-[#FF6B0B]/10',
      iconColor: 'text-[#FF6B0B]',
    },
  ]

  // ─────────────────────────────────────────────
  // ACTIONS RAPIDES
  // ─────────────────────────────────────────────

  const quickActions = [
    {
      title: 'Créer un utilisateur',
      description: 'Ajouter un apprenant ou formateur',
      icon: UserPlus,
      href: '/users/new',
    },
    {
      title: 'Créer un programme',
      description: 'Ajouter une nouvelle formation',
      icon: BookOpen,
      href: '/programmes/new',
    },
    {
      title: 'Créer une rentrée',
      description: 'Planifier une nouvelle rentrée',
      icon: CalendarDays,
      href: '/rentrees/new',
    },
    {
      title: 'Créer une cohorte',
      description: 'Créer un nouveau groupe',
      icon: GraduationCap,
      href: '/cohortes/new',
    },
  ]

  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-[#19192D] md:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* ═══════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════ */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="mb-1 text-sm font-medium text-[#FF6B0B]">
              Tableau de bord
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              Bonjour, {firstName} 👋
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Voici un aperçu de l’activité de votre académie.
            </p>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() => navigate('/users/new')}
              className="
                flex items-center gap-2
                rounded-xl
                bg-[#FF6B0B]
                px-4 py-2.5
                text-sm font-semibold
                text-white
                shadow-sm
                transition-all
                hover:bg-[#FF6B0B]/90
                hover:shadow-md
                active:scale-[0.98]
              "
            >
              <Plus className="size-4" />
              Nouvel utilisateur
            </button>

          </div>

        </div>

        {/* ═══════════════════════════════════════════
            STATISTIQUES
        ═══════════════════════════════════════════ */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {statistics.map((stat) => {
            const Icon = stat.icon
            const isPositive = stat.trend === 'up'
            const TrendIcon = isPositive ? TrendingUp : TrendingDown

            return (
              <button
                key={stat.title}
                type="button"
                onClick={() => navigate(stat.href)}
                className="
                  group
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  p-5
                  text-left
                  shadow-sm
                  transition-all
                  hover:-translate-y-0.5
                  hover:shadow-md

                  dark:border-white/10
                  dark:bg-white/[0.04]
                  dark:hover:bg-white/[0.06]
                "
              >

                <div className="flex items-start justify-between">

                  <div
                    className={`
                      flex size-11
                      items-center justify-center
                      rounded-xl
                      ${stat.iconBg}
                    `}
                  >
                    <Icon
                      className={`size-5 ${stat.iconColor}`}
                    />
                  </div>

                  <ArrowRight
                    className="
                      size-4
                      text-slate-300
                      opacity-0
                      transition-all
                      group-hover:translate-x-1
                      group-hover:opacity-100
                      dark:text-slate-600
                    "
                  />

                </div>

                <div className="mt-4">

                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>

                  <div className="mt-1 flex items-end gap-2">

                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </span>

                    <span
                      className={`
                        mb-1 flex items-center gap-1
                        text-xs font-semibold
                        ${isPositive ? 'text-emerald-500' : 'text-red-500'}
                      `}
                    >
                      <TrendIcon className="size-3" />
                      {stat.change}
                    </span>

                  </div>

                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {stat.description}
                  </p>

                </div>

              </button>
            )
          })}

        </div>

        {/* ═══════════════════════════════════════════
            ACTIONS RAPIDES
        ═══════════════════════════════════════════ */}

        <div>

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Actions rapides
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Accédez rapidement aux principales fonctionnalités.
              </p>
            </div>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => navigate(action.href)}
                  className="
                    group
                    flex
                    items-center
                    gap-4
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    p-4
                    text-left
                    shadow-sm
                    transition-all
                    hover:border-[#FF6B0B]/30
                    hover:shadow-md

                    dark:border-white/10
                    dark:bg-white/[0.04]
                    dark:hover:bg-white/[0.06]
                  "
                >

                  <div className="
                    flex size-10 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-[#FF6B0B]/10
                    text-[#FF6B0B]
                    transition-transform
                    group-hover:scale-105
                  ">
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {action.title}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {action.description}
                    </p>

                  </div>

                  <ArrowRight className="
                    size-4 shrink-0
                    text-slate-300
                    transition-transform
                    group-hover:translate-x-1
                    dark:text-slate-600
                  " />

                </button>
              )
            })}

          </div>

        </div>

        {/* ═══════════════════════════════════════════
            CONTENU PRINCIPAL
        ═══════════════════════════════════════════ */}

        <div className="grid gap-6 xl:grid-cols-2">

          {/* ═════════════════════════════════════════
              UTILISATEURS RÉCENTS
          ═════════════════════════════════════════ */}

          <div className="
            overflow-hidden
            rounded-2xl
            border border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-white/[0.04]
          ">

            <div className="
              flex items-center
              justify-between
              border-b border-slate-200
              px-5 py-4
              dark:border-white/10
            ">

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Utilisateurs récents
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Derniers utilisateurs ajoutés
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/users')}
                className="
                  flex items-center gap-1
                  text-xs font-semibold
                  text-[#FF6B0B]
                  hover:underline
                "
              >
                Voir tout
                <ArrowRight className="size-3.5" />
              </button>

            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">

              {recentUsers.map((recentUser) => (

                <div
                  key={recentUser.email}
                  className="
                    flex items-center gap-3
                    px-5 py-4
                    transition-colors
                    hover:bg-slate-50
                    dark:hover:bg-white/[0.02]
                  "
                >

                  <div className="
                    flex size-10 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#FF6B0B]/10
                    text-xs font-bold
                    text-[#FF6B0B]
                  ">
                    {recentUser.initials}
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {recentUser.name}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {recentUser.email}
                    </p>

                    {/* Rôle + date visibles sur mobile, sous l'email */}
                    <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:hidden">
                      {recentUser.role} · {recentUser.date}
                    </p>

                  </div>

                  <div className="hidden text-right sm:block">

                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {recentUser.role}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                      {recentUser.date}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* ═════════════════════════════════════════
              ACTIVITÉS RÉCENTES
          ═════════════════════════════════════════ */}

          <div className="
            overflow-hidden
            rounded-2xl
            border border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-white/[0.04]
          ">

            <div className="
              flex items-center
              justify-between
              border-b border-slate-200
              px-5 py-4
              dark:border-white/10
            ">

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Activité récente
                </h2>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Dernières actions sur la plateforme
                </p>
              </div>

              <Activity className="size-5 text-[#FF6B0B]" />

            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">

              {activities.map((activity) => {
                const Icon = activity.icon

                return (
                  <div
                    key={activity.title}
                    className="
                      flex items-center gap-3
                      px-5 py-4
                    "
                  >

                    <div
                      className={`
                        flex size-9 shrink-0
                        items-center justify-center
                        rounded-xl
                        ${activity.iconBg}
                        ${activity.iconColor}
                      `}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {activity.title}
                      </p>

                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {activity.description}
                      </p>

                    </div>

                    <div className="
                      flex shrink-0
                      items-center gap-1
                      text-[10px]
                      text-slate-400
                      dark:text-slate-500
                    ">
                      <Clock3 className="size-3" />
                      {activity.time}
                    </div>

                  </div>
                )
              })}

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default AdminDashboard