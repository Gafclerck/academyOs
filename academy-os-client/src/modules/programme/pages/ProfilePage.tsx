import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Save,
  Loader2,
  Shield,
  CheckCircle2,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // ─────────────────────────────────────────────
  // REMPLIR LE FORMULAIRE AVEC LES INFORMATIONS
  // DE L'UTILISATEUR CONNECTÉ
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) return

    setFirstName(user.first_name || '')
    setLastName(user.last_name || '')
    setPhoneNumber(user.phone_number || '')
  }, [user])

  // ─────────────────────────────────────────────
  // ENREGISTREMENT
  // ─────────────────────────────────────────────

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setSuccess(false)

    if (!firstName.trim()) {
      setError('Le prénom est obligatoire.')
      return
    }

    if (!lastName.trim()) {
      setError('Le nom est obligatoire.')
      return
    }

    try {
      setLoading(true)

      /*
       * TODO :
       * Ici nous allons appeler le service PATCH /auth/me/
       * lorsque tu me donneras ton service API.
       */

      // Simulation temporaire
      await new Promise((resolve) =>
        setTimeout(resolve, 800),
      )

      setSuccess(true)
    } catch (err) {
      console.error(
        'Erreur lors de la modification du profil :',
        err,
      )

      setError(
        'Impossible de modifier votre profil. Veuillez réessayer.',
      )
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // UTILISATEUR NON CHARGÉ
  // ─────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#FF6B0B]" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 transition-colors duration-500 dark:bg-[#19192D] sm:p-6 lg:p-8">

      <div className="mx-auto max-w-3xl">

        {/* ═══════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════ */}

        <div className="mb-6 flex items-center gap-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              flex size-10 shrink-0 items-center
              justify-center rounded-xl
              border border-slate-200
              bg-white
              text-slate-600
              transition-all
              hover:border-[#FF6B0B]/30
              hover:bg-[#FF6B0B]/5
              hover:text-[#FF6B0B]
              dark:border-white/10
              dark:bg-white/[0.04]
              dark:text-slate-300
              dark:hover:bg-white/[0.08]
            "
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div>
            <h1 className="
              text-2xl font-bold
              text-slate-900
              dark:text-white
            ">
              Mon profil
            </h1>

            <p className="
              mt-1 text-sm
              text-slate-500
              dark:text-slate-400
            ">
              Consultez et modifiez vos informations personnelles.
            </p>
          </div>

        </div>

        {/* ═══════════════════════════════════════════
            PROFILE CARD
        ═══════════════════════════════════════════ */}

        <div className="
          overflow-hidden rounded-3xl
          border border-slate-200
          bg-white
          shadow-xl shadow-slate-200/40
          dark:border-white/10
          dark:bg-white/[0.05]
          dark:shadow-black/20
        ">

          {/* PROFILE HEADER */}

          <div className="
            relative overflow-hidden
            border-b border-slate-200
            px-6 py-8
            dark:border-white/10
            sm:px-8
          ">

            <div className="
              pointer-events-none
              absolute -right-20 -top-20
              size-48 rounded-full
              bg-[#FF6B0B]/10
              blur-3xl
            " />

            <div className="
              relative flex items-center gap-4
            ">

              {/* AVATAR */}

              <div className="
                flex size-16 shrink-0
                items-center justify-center
                rounded-2xl
                bg-[#FF6B0B]/15
                text-xl font-bold
                text-[#FF6B0B]
              ">
                {user.first_name?.charAt(0)}
                {user.last_name?.charAt(0)}
              </div>

              <div className="min-w-0">

                <h2 className="
                  truncate text-xl font-bold
                  text-slate-900
                  dark:text-white
                ">
                  {user.first_name} {user.last_name}
                </h2>

                <p className="
                  mt-1 truncate text-sm
                  text-slate-500
                  dark:text-slate-400
                ">
                  {user.email}
                </p>

              </div>

            </div>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >

            {/* ERROR */}

            {error && (
              <div className="
                mb-6 flex items-start gap-3
                rounded-xl border
                border-red-200
                bg-red-50
                p-4 text-sm text-red-600
                dark:border-red-500/20
                dark:bg-red-500/10
                dark:text-red-400
              ">
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="
                mb-6 flex items-center gap-3
                rounded-xl border
                border-green-200
                bg-green-50
                p-4 text-sm text-green-600
                dark:border-green-500/20
                dark:bg-green-500/10
                dark:text-green-400
              ">
                <CheckCircle2 className="size-5 shrink-0" />
                <span>
                  Vos informations ont été enregistrées avec succès.
                </span>
              </div>
            )}

            <div className="space-y-6">

              {/* ═════════════════════════════════════
                  PRÉNOM
              ═════════════════════════════════════ */}

              <div>
                <label
                  htmlFor="firstName"
                  className="
                    mb-2 block text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Prénom
                </label>

                <div className="relative">

                  <User className="
                    absolute left-4 top-1/2
                    size-4 -translate-y-1/2
                    text-slate-400
                    dark:text-slate-500
                  " />

                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    disabled={loading}
                    placeholder="Votre prénom"
                    className="
                      h-12 w-full rounded-xl
                      border border-slate-200
                      bg-slate-50
                      pl-11 pr-4
                      text-sm text-slate-900
                      outline-none
                      transition-all
                      placeholder:text-slate-400
                      focus:border-[#FF6B0B]/60
                      focus:bg-white
                      focus:ring-4
                      focus:ring-[#FF6B0B]/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      dark:border-white/10
                      dark:bg-white/5
                      dark:text-white
                      dark:placeholder:text-slate-600
                      dark:focus:bg-white/[0.08]
                    "
                  />

                </div>
              </div>

              {/* ═════════════════════════════════════
                  NOM
              ═════════════════════════════════════ */}

              <div>
                <label
                  htmlFor="lastName"
                  className="
                    mb-2 block text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Nom
                </label>

                <div className="relative">

                  <User className="
                    absolute left-4 top-1/2
                    size-4 -translate-y-1/2
                    text-slate-400
                    dark:text-slate-500
                  " />

                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    disabled={loading}
                    placeholder="Votre nom"
                    className="
                      h-12 w-full rounded-xl
                      border border-slate-200
                      bg-slate-50
                      pl-11 pr-4
                      text-sm text-slate-900
                      outline-none
                      transition-all
                      placeholder:text-slate-400
                      focus:border-[#FF6B0B]/60
                      focus:bg-white
                      focus:ring-4
                      focus:ring-[#FF6B0B]/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      dark:border-white/10
                      dark:bg-white/5
                      dark:text-white
                      dark:placeholder:text-slate-600
                      dark:focus:bg-white/[0.08]
                    "
                  />

                </div>
              </div>

              {/* ═════════════════════════════════════
                  EMAIL — NON MODIFIABLE
              ═════════════════════════════════════ */}

              <div>
                <label
                  htmlFor="email"
                  className="
                    mb-2 flex items-center gap-2
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Adresse email

                  <span className="
                    rounded-md
                    bg-slate-100
                    px-2 py-0.5
                    text-[10px]
                    font-medium
                    text-slate-500
                    dark:bg-white/10
                    dark:text-slate-400
                  ">
                    Non modifiable
                  </span>
                </label>

                <div className="relative">

                  <Mail className="
                    absolute left-4 top-1/2
                    size-4 -translate-y-1/2
                    text-slate-400
                    dark:text-slate-500
                  " />

                  <input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    readOnly
                    className="
                      h-12 w-full rounded-xl
                      border border-slate-200
                      bg-slate-100
                      pl-11 pr-4
                      text-sm text-slate-500
                      outline-none
                      cursor-not-allowed
                      dark:border-white/10
                      dark:bg-white/[0.03]
                      dark:text-slate-500
                    "
                  />

                </div>
              </div>

              {/* ═════════════════════════════════════
                  TÉLÉPHONE
              ═════════════════════════════════════ */}

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="
                    mb-2 block text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Numéro de téléphone
                </label>

                <div className="relative">

                  <Phone className="
                    absolute left-4 top-1/2
                    size-4 -translate-y-1/2
                    text-slate-400
                    dark:text-slate-500
                  " />

                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(event.target.value)
                    }
                    disabled={loading}
                    placeholder="Ex : 77 123 45 67"
                    className="
                      h-12 w-full rounded-xl
                      border border-slate-200
                      bg-slate-50
                      pl-11 pr-4
                      text-sm text-slate-900
                      outline-none
                      transition-all
                      placeholder:text-slate-400
                      focus:border-[#FF6B0B]/60
                      focus:bg-white
                      focus:ring-4
                      focus:ring-[#FF6B0B]/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      dark:border-white/10
                      dark:bg-white/5
                      dark:text-white
                      dark:placeholder:text-slate-600
                      dark:focus:bg-white/[0.08]
                    "
                  />

                </div>
              </div>

              {/* ═════════════════════════════════════
                  RÔLE
              ═════════════════════════════════════ */}

              <div>
                <label
                  htmlFor="role"
                  className="
                    mb-2 flex items-center gap-2
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Rôle

                  <span className="
                    rounded-md
                    bg-slate-100
                    px-2 py-0.5
                    text-[10px]
                    font-medium
                    text-slate-500
                    dark:bg-white/10
                    dark:text-slate-400
                  ">
                    Non modifiable
                  </span>
                </label>

                <div className="relative">

                  <Shield className="
                    absolute left-4 top-1/2
                    size-4 -translate-y-1/2
                    text-slate-400
                    dark:text-slate-500
                  " />

                  <input
                    id="role"
                    type="text"
                    value={user.role || ''}
                    disabled
                    readOnly
                    className="
                      h-12 w-full rounded-xl
                      border border-slate-200
                      bg-slate-100
                      pl-11 pr-4
                      text-sm text-slate-500
                      outline-none
                      cursor-not-allowed
                      capitalize
                      dark:border-white/10
                      dark:bg-white/[0.03]
                      dark:text-slate-500
                    "
                  />

                </div>
              </div>

            </div>

            {/* ═════════════════════════════════════════
                BUTTON
            ═════════════════════════════════════════ */}

            <div className="
              mt-8 flex
              justify-end
            ">

              <button
                type="submit"
                disabled={loading}
                className="
                  flex h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#FF6B0B]
                  px-6
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  shadow-[#FF6B0B]/20
                  transition-all
                  hover:scale-[1.01]
                  hover:bg-[#ff7a24]
                  hover:shadow-[#FF6B0B]/30
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Enregistrer les modifications
                  </>
                )}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  )
}

export default ProfilePage

