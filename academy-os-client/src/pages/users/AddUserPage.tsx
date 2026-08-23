import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Shield,
  Loader2,
  CheckCircle2,
} from 'lucide-react'


import { inviteUser } from '@/services/users/users'

type UserRole = 'learner' | 'trainer'

const AddUserPage: React.FC = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('learner')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const response = await inviteUser(email, role)

      console.log('Invitation envoyée :', response)

      alert('Invitation envoyée avec succès !')

      navigate('/users')
    } catch (error: any) {
      console.error('Erreur invitation :', error)

      alert(
        error?.response?.data?.detail ||
        "Impossible d'envoyer l'invitation."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="mb-6">

        <button
          type="button"
          onClick={() => navigate('/users')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B]"
        >
          <ArrowLeft className="size-4" />
          Retour aux utilisateurs
        </button>

        <div className="flex items-center gap-3">

          <div className="flex size-11 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">
            <UserPlus className="size-5" />
          </div>

          <div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Inviter un utilisateur
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Envoyez une invitation par email pour créer un compte.
            </p>

          </div>

        </div>
      </div>

      {/* FORMULAIRE */}
      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#151528]">

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* EMAIL */}
          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Adresse email
            </label>

            <div className="relative">

              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />

            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Un email d'invitation sera envoyé à cette adresse.
            </p>

          </div>

          {/* ROLE */}
          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Rôle
            </label>

            <div className="relative">

              <Shield className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as UserRole)
                }
                disabled={loading}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f38] dark:text-white"
              >

                <option value="learner">
                  Apprenant
                </option>

                <option value="trainer">
                  Formateur
                </option>



              </select>

            </div>

          </div>

          {/* INFORMATION */}
          <div className="rounded-xl border border-[#FF6B0B]/20 bg-[#FF6B0B]/5 p-4">

            <div className="flex items-start gap-3">

              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#FF6B0B]" />

              <div>

                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Comment ça fonctionne ?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  L'utilisateur recevra un email contenant
                  un code d'invitation. Il pourra ensuite
                  définir son mot de passe et accéder à
                  Xarala OS.
                </p>

              </div>

            </div>

          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/10">

            <button
              type="button"
              onClick={() => navigate('/users')}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Envoyer l'invitation
                </>
              )}

            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default AddUserPage