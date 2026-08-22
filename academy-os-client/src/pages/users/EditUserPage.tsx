import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Mail,
  Shield,
  Loader2,
} from 'lucide-react'

import {
  getUsers,
  updateUser,
  type User,
} from '@/services/users/users'

const EditUserPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [user, setUser] = useState<User | null>(null)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<User['role']>('learner')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ============================================================
  // RÉCUPÉRER L'UTILISATEUR
  // ============================================================

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError('')

        const users = await getUsers()

        const foundUser = users.find(
          (item) => item.id === id,
        )

        if (!foundUser) {
          setError('Utilisateur introuvable.')
          return
        }

        setUser(foundUser)

        // Préremplir le formulaire
        setEmail(foundUser.email)
        setRole(foundUser.role)
      } catch (err) {
        console.error(
          'Erreur lors de la récupération de l’utilisateur :',
          err,
        )

        setError(
          'Impossible de charger les informations de l’utilisateur.',
        )
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchUser()
    }
  }, [id])

  // ============================================================
  // ENREGISTRER
  // ============================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!id) {
      setError('Identifiant utilisateur manquant.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await updateUser(id, {
        email: email.trim(),
        role,
      })

      navigate('/users')
    } catch (err) {
      console.error(
        'Erreur lors de la modification :',
        err,
      )

      setError(
        'Impossible de modifier cet utilisateur.',
      )
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-7 animate-spin text-[#FF6B0B]" />

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Chargement de l’utilisateur...
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // UTILISATEUR INTROUVABLE
  // ============================================================

  if (!user) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">

          <p className="font-medium text-red-600 dark:text-red-400">
            {error || 'Utilisateur introuvable.'}
          </p>

          <button
            type="button"
            onClick={() => navigate('/users')}
            className="mt-4 rounded-lg bg-[#FF6B0B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e85f08]"
          >
            Retour aux utilisateurs
          </button>

        </div>
      </div>
    )
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}

      <div className="flex items-center gap-4">

        <button
          type="button"
          onClick={() => navigate('/users')}
          className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#151528] dark:text-slate-300 dark:hover:bg-white/5"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Modifier l'utilisateur
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Modifier l'email et le rôle de l'utilisateur
          </p>
        </div>

      </div>

      {/* FORMULAIRE */}

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]"
      >

        {/* TITRE */}

        <div className="mb-6 border-b border-slate-200 pb-5 dark:border-white/10">

          <h2 className="font-semibold text-slate-900 dark:text-white">
            Informations du compte
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Les informations personnelles ne peuvent pas être
            modifiées ici.
          </p>

        </div>

        {/* ERREUR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-5">

          {/* EMAIL */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Adresse email
            </label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#FF6B0B] dark:border-white/10 dark:bg-[#10101f] dark:text-white"
                placeholder="email@example.com"
              />

            </div>

          </div>

          {/* RÔLE */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Rôle
            </label>

            <div className="relative">

              <Shield className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <select
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as User['role'],
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#FF6B0B] dark:border-white/10 dark:bg-[#10101f] dark:text-white"
              >

                <option value="admin">
                  Administrateur
                </option>

                <option value="organizer">
                  Organisateur
                </option>

                <option value="trainer">
                  Formateur
                </option>

                <option value="learner">
                  Apprenant
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/10">

          <button
            type="button"
            onClick={() => navigate('/users')}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Enregistrer
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  )
}

export default EditUserPage