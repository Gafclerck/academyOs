import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Shield,
} from 'lucide-react'

import { getUsers, type User } from '@/services/users'

const UsersPage: React.FC = () => {
  const navigate = useNavigate()

  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ============================================================
  // RÉCUPÉRATION DES UTILISATEURS DEPUIS DJANGO
  // ============================================================

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getUsers()

        console.log('UTILISATEURS RÉCUPÉRÉS :', data)

        setUsers(data)
      } catch (err) {
        console.error(
          'Erreur lors de la récupération des utilisateurs :',
          err,
        )

        setError(
          'Impossible de charger les utilisateurs.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // ============================================================
  // RECHERCHE
  // ============================================================

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase().trim()

    if (!value) {
      return users
    }

    return users.filter((user) => {
      return (
        user.first_name?.toLowerCase().includes(value) ||
        user.last_name?.toLowerCase().includes(value) ||
        user.email?.toLowerCase().includes(value) ||
        user.role?.toLowerCase().includes(value)
      )
    })
  }, [users, search])

  // ============================================================
  // TRADUCTION DES RÔLES
  // ============================================================

  const getRoleLabel = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrateur'

      case 'organizer':
        return 'Organisateur'

      case 'trainer':
        return 'Formateur'

      case 'learner':
        return 'Apprenant'

      default:
        return role
    }
  }

  // ============================================================
  // COULEUR DU RÔLE
  // ============================================================

  const getRoleClass = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'

      case 'organizer':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'

      case 'trainer':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'

      case 'learner':
        return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'

      default:
        return 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
    }
  }

  // ============================================================
  // NOM AFFICHÉ
  // ============================================================

  const getUserName = (user: User) => {
    if (user.full_name?.trim()) {
      return user.full_name
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()

    if (fullName) {
      return fullName
    }

    return user.email
  }

  // ============================================================
  // INITIALES
  // ============================================================

  const getInitials = (user: User) => {
    if (user.first_name || user.last_name) {
      const firstInitial = user.first_name
        ? user.first_name.charAt(0).toUpperCase()
        : ''

      const lastInitial = user.last_name
        ? user.last_name.charAt(0).toUpperCase()
        : ''

      return `${firstInitial}${lastInitial}`
    }

    return user.email.charAt(0).toUpperCase()
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="space-y-6 p-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Utilisateurs
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gérez les utilisateurs de Xarala OS
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/users/new')}
          className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08]"
        >
          <Plus className="size-4" />

          Ajouter un utilisateur
        </button>

      </div>

      {/* ======================================================
          RECHERCHE
      ====================================================== */}

      <div className="relative max-w-md">

        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#FF6B0B] dark:border-white/10 dark:bg-[#151528] dark:text-white"
        />

      </div>

      {/* ======================================================
          LISTE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#151528]">

        {/* HEADER LISTE */}

        <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">

          <div className="flex items-center gap-2">

            <Users className="size-5 text-[#FF6B0B]" />

            <h2 className="font-semibold text-slate-900 dark:text-white">
              Liste des utilisateurs
            </h2>

            {!loading && (
              <span className="rounded-full bg-[#FF6B0B]/10 px-2 py-0.5 text-xs font-semibold text-[#FF6B0B]">
                {filteredUsers.length}
              </span>
            )}

          </div>

        </div>

        {/* ==================================================
            CHARGEMENT
        ================================================== */}

        {loading && (
          <div className="px-6 py-12 text-center">

            <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#FF6B0B]" />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chargement des utilisateurs...
            </p>

          </div>
        )}

        {/* ==================================================
            ERREUR
        ================================================== */}

        {!loading && error && (
          <div className="px-6 py-12 text-center">

            <p className="text-sm font-medium text-red-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#FF6B0B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e85f08]"
            >
              Réessayer
            </button>

          </div>
        )}

        {/* ==================================================
            UTILISATEURS
        ================================================== */}

        {!loading && !error && (
          <div className="divide-y divide-slate-100 dark:divide-white/5">

            {filteredUsers.map((user) => (

              <div
                key={user.id}
                className="flex items-center justify-between px-6 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.02]"
              >

                {/* ==========================================
                    INFORMATIONS UTILISATEUR
                ========================================== */}

                <div className="flex items-center gap-4">

                  {/* AVATAR */}

                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FF6B0B]/10 font-bold text-[#FF6B0B]">
                    {getInitials(user)}
                  </div>

                  {/* NOM + COORDONNÉES */}

                  <div>

                    <p className="font-semibold text-slate-900 dark:text-white">
                      {getUserName(user)}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">

                      {/* EMAIL */}

                      <span className="flex items-center gap-1">
                        <Mail className="size-3.5" />
                        {user.email}
                      </span>

                      {/* TÉLÉPHONE */}

                      {user.phone_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3.5" />
                          {user.phone_number}
                        </span>
                      )}

                    </div>

                  </div>

                </div>

                {/* ==========================================
                    RÔLE + STATUT
                ========================================== */}

                <div className="flex items-center gap-3">

                  {/* STATUT */}

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                        : user.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400'
                          : user.status === 'suspended'
                            ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
                    }`}
                  >
                    {user.status === 'active'
                      ? 'Actif'
                      : user.status === 'pending'
                        ? 'En attente'
                        : user.status === 'suspended'
                          ? 'Suspendu'
                          : 'Archivé'}
                  </span>

                  {/* RÔLE */}

                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${getRoleClass(
                      user.role,
                    )}`}
                  >
                    <Shield className="size-3.5" />

                    {getRoleLabel(user.role)}
                  </div>

                </div>

              </div>

            ))}

            {/* ==================================================
                AUCUN UTILISATEUR
            ================================================== */}

            {filteredUsers.length === 0 && (
              <div className="px-6 py-12 text-center">

                <Users className="mx-auto size-10 text-slate-300 dark:text-slate-600" />

                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Aucun utilisateur trouvé.
                </p>

                {search && (
                  <p className="mt-1 text-xs text-slate-400">
                    Essayez avec un autre terme de recherche.
                  </p>
                )}

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  )
}

export default UsersPage