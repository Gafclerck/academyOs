import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  UserPlus,
  Mail,
  GraduationCap,
  UsersRound,
  Loader2,
  CheckCircle2,
  Send,
} from 'lucide-react'

import { inviteUser } from '@/services/users/users'

type UserRole = 'learner' | 'trainer'

const AddUserPage: React.FC = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('learner')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleClose = () => {
    if (!loading) {
      navigate('/users')
    }
  }

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault()

    if (!email.trim()) {
      return
    }

    try {
      setLoading(true)

      const response = await inviteUser(
        email.trim(),
        role,
      )

      console.log(
        'Invitation envoyée :',
        response,
      )

      // On affiche le succès dans le modal
      setSuccess(true)

    } catch (error: any) {
      console.error(
        'Erreur invitation :',
        error,
      )

      alert(
        error?.response?.data?.detail ||
          "Impossible d'envoyer l'invitation.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

      {/* MODAL */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151528]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* =========================
            HEADER
        ========================== */}

        <div className="relative border-b border-slate-200 px-6 pb-5 pt-6 dark:border-white/10">

          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[#FF6B0B]/10 blur-2xl" />

          <div className="relative flex items-start justify-between">

            <div className="flex items-center gap-4">

              <div
                className={`flex size-12 items-center justify-center rounded-2xl ${
                  success
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-[#FF6B0B]/10 text-[#FF6B0B]'
                }`}
              >
                {success ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <UserPlus className="size-6" />
                )}
              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {success
                    ? 'Invitation envoyée'
                    : 'Inviter un utilisateur'}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {success
                    ? 'L’invitation a été envoyée avec succès.'
                    : 'Ajoutez un nouveau membre à Xarala OS.'}
                </p>

              </div>

            </div>

            {/* FERMER */}

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Fermer"
            >
              <X className="size-5" />
            </button>

          </div>
        </div>

        {/* ==================================================
            SUCCÈS
        ================================================== */}

        {success ? (

          <div className="px-6 py-10">

            {/* ICÔNE */}
            <div className="flex justify-center">

              <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">

                <CheckCircle2 className="size-10 text-emerald-500" />

              </div>

            </div>

            {/* TITRE */}
            <div className="mt-6 text-center">

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Invitation envoyée !
              </h3>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                L'invitation a été envoyée avec succès à
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {' '}
                  {email}
                </span>
                .
              </p>

            </div>

            {/* INFORMATIONS */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">

              <div className="flex items-center gap-3">

                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10 text-[#FF6B0B]">

                  {role === 'learner' ? (
                    <GraduationCap className="size-5" />
                  ) : (
                    <UsersRound className="size-5" />
                  )}

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type d'utilisateur
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                    {role === 'learner'
                      ? 'Apprenant'
                      : 'Formateur'}
                  </p>

                </div>

              </div>

            </div>

            {/* MESSAGE */}
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">

              <div className="flex items-start gap-3">

                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />

                <p className="text-xs leading-5 text-emerald-700 dark:text-emerald-400">
                  L'utilisateur recevra un email contenant
                  les instructions nécessaires pour créer
                  son mot de passe et accéder à Xarala OS.
                </p>

              </div>

            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                  setRole('learner')
                }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Inviter un autre
              </button>

              <button
                type="button"
                onClick={() => navigate('/users')}
                className="rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08]"
              >
                Voir les utilisateurs
              </button>

            </div>

          </div>

        ) : (

          /* ==================================================
             FORMULAIRE
          ================================================== */

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Adresse email
              </label>

              <div className="relative">

                <Mail className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="exemple@email.com"
                  required
                  disabled={loading}
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF6B0B] focus:bg-white focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/[0.07]"
                />

              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Une invitation sera envoyée à cette adresse.
              </p>

            </div>

            {/* ROLE */}

            <div>

              <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Type d'utilisateur
              </label>

              <div className="grid grid-cols-2 gap-3">

                {/* APPRENANT */}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setRole('learner')
                  }
                  className={`group rounded-2xl border p-4 text-left transition ${
                    role === 'learner'
                      ? 'border-[#FF6B0B] bg-[#FF6B0B]/5 ring-2 ring-[#FF6B0B]/10'
                      : 'border-slate-200 bg-white hover:border-[#FF6B0B]/40 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/5'
                  }`}
                >

                  <div className="flex items-start justify-between">

                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        role === 'learner'
                          ? 'bg-[#FF6B0B]/10 text-[#FF6B0B]'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                      }`}
                    >
                      <GraduationCap className="size-5" />
                    </div>

                    {role === 'learner' && (
                      <CheckCircle2 className="size-5 text-[#FF6B0B]" />
                    )}

                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Apprenant
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Suit les formations et participe aux projets.
                  </p>

                </button>

                {/* FORMATEUR */}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setRole('trainer')
                  }
                  className={`group rounded-2xl border p-4 text-left transition ${
                    role === 'trainer'
                      ? 'border-[#FF6B0B] bg-[#FF6B0B]/5 ring-2 ring-[#FF6B0B]/10'
                      : 'border-slate-200 bg-white hover:border-[#FF6B0B]/40 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/5'
                  }`}
                >

                  <div className="flex items-start justify-between">

                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        role === 'trainer'
                          ? 'bg-[#FF6B0B]/10 text-[#FF6B0B]'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                      }`}
                    >
                      <UsersRound className="size-5" />
                    </div>

                    {role === 'trainer' && (
                      <CheckCircle2 className="size-5 text-[#FF6B0B]" />
                    )}

                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                    Formateur
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Accompagne et encadre les apprenants.
                  </p>

                </button>

              </div>
            </div>

            {/* INFORMATION */}

            <div className="rounded-2xl border border-[#FF6B0B]/20 bg-[#FF6B0B]/5 p-4">

              <div className="flex items-start gap-3">

                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10">

                  <Send className="size-4 text-[#FF6B0B]" />

                </div>

                <div>

                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    Invitation par email
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    L'utilisateur recevra un email avec
                    un code ou un lien d'invitation lui
                    permettant de créer son mot de passe
                    et d'accéder à Xarala OS.
                  </p>

                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/10">

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  !email.trim()
                }
                className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Envoyer l'invitation
                  </>
                )}

              </button>

            </div>

          </form>

        )}

      </div>
    </div>
  )
}

export default AddUserPage