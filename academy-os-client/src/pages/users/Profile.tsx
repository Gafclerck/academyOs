
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Shield,
  Save,
  Loader2,
} from 'lucide-react'

import API from '@/api/api'
import { useAuth } from '@/context/AuthContext'

const Profile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [loading, setLoading] = useState(false)

  // ─────────────────────────────────────────────
  // REMPLIR LES CHAMPS AVEC LES INFORMATIONS USER
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) return

    setFirstName(user.first_name || '')
    setLastName(user.last_name || '')
    setPhoneNumber(user.phone_number || '')
  }, [user])

  // ─────────────────────────────────────────────
  // ENREGISTRER LES MODIFICATIONS
  // ─────────────────────────────────────────────

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!user) return

    // Vérification simple
    if (!firstName.trim()) {
      toast.error('Le prénom est obligatoire.')
      return
    }

    if (!lastName.trim()) {
      toast.error('Le nom est obligatoire.')
      return
    }

    try {
      setLoading(true)

      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
      }

      // PATCH du profil utilisateur
      await API.patch('/auth/me/', payload)

      toast.success('Votre profil a été mis à jour avec succès.')

    } catch (error: any) {
      console.error(
        'Erreur lors de la modification du profil :',
        error,
      )

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Impossible de modifier votre profil.'

      toast.error(message)

    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // SI USER NON DISPONIBLE
  // ─────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#FF6B0B]" />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // INITIALS
  // ─────────────────────────────────────────────

  const initials =
    `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`
      .toUpperCase()

  return (
    <div className="min-h-full bg-slate-50 p-6 dark:bg-[#19192D]">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-6 flex items-center gap-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              flex size-10 items-center justify-center
              rounded-xl
              border border-slate-200
              bg-white
              text-slate-600
              transition-all
              hover:bg-slate-100
              dark:border-white/10
              dark:bg-white/[0.04]
              dark:text-slate-300
              dark:hover:bg-white/[0.08]
            "
          >
            <ArrowLeft className="size-5" />
          </button>

          <div>
            <h1
              className="
                text-2xl font-bold
                text-slate-900
                dark:text-white
              "
            >
              Mon profil
            </h1>

            <p
              className="
                mt-1 text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Consultez et modifiez vos informations personnelles.
            </p>
          </div>

        </div>

        {/* PROFILE CARD */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border border-slate-200
            bg-white
            shadow-sm
            dark:border-white/10
            dark:bg-white/[0.04]
          "
        >

          {/* PROFILE HEADER */}

          <div
            className="
              border-b border-slate-200
              px-6 py-6
              dark:border-white/10
            "
          >

            <div className="flex items-center gap-4">

              {/* AVATAR */}

              <div
                className="
                  flex size-16 shrink-0
                  items-center justify-center
                  rounded-2xl
                  bg-[#FF6B0B]/10
                  text-xl font-bold
                  text-[#FF6B0B]
                "
              >
                {initials || 'U'}
              </div>

              <div>

                <h2
                  className="
                    text-lg font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {user.first_name} {user.last_name}
                </h2>

                <p
                  className="
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {user.email}
                </p>

              </div>

            </div>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >

            {/* INFORMATIONS PERSONNELLES */}

            <div>

              <h3
                className="
                  mb-4 text-sm font-bold
                  uppercase tracking-wide
                  text-slate-900
                  dark:text-white
                "
              >
                Informations personnelles
              </h3>

              <div className="grid gap-5 md:grid-cols-2">

                {/* PRÉNOM */}

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

                    <User
                      className="
                        absolute left-3 top-1/2
                        size-4 -translate-y-1/2
                        text-slate-400
                      "
                    />

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
                        h-11 w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        pl-10 pr-4
                        text-sm text-slate-900
                        outline-none
                        transition-all

                        focus:border-[#FF6B0B]/60
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[#FF6B0B]/10

                        dark:border-white/10
                        dark:bg-white/5
                        dark:text-white
                        dark:focus:bg-white/[0.08]
                      "
                    />

                  </div>

                </div>

                {/* NOM */}

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

                    <User
                      className="
                        absolute left-3 top-1/2
                        size-4 -translate-y-1/2
                        text-slate-400
                      "
                    />

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
                        h-11 w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        pl-10 pr-4
                        text-sm text-slate-900
                        outline-none
                        transition-all

                        focus:border-[#FF6B0B]/60
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[#FF6B0B]/10

                        dark:border-white/10
                        dark:bg-white/5
                        dark:text-white
                        dark:focus:bg-white/[0.08]
                      "
                    />

                  </div>

                </div>

                {/* TÉLÉPHONE */}

                <div className="md:col-span-2">

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

                    <Phone
                      className="
                        absolute left-3 top-1/2
                        size-4 -translate-y-1/2
                        text-slate-400
                      "
                    />

                    <input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) =>
                        setPhoneNumber(event.target.value)
                      }
                      disabled={loading}
                      placeholder="77 000 00 00"
                      className="
                        h-11 w-full rounded-xl
                        border border-slate-200
                        bg-slate-50
                        pl-10 pr-4
                        text-sm text-slate-900
                        outline-none
                        transition-all

                        focus:border-[#FF6B0B]/60
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[#FF6B0B]/10

                        dark:border-white/10
                        dark:bg-white/5
                        dark:text-white
                        dark:focus:bg-white/[0.08]
                      "
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* INFORMATIONS DU COMPTE */}

            <div
              className="
                border-t border-slate-200
                pt-6
                dark:border-white/10
              "
            >

              <h3
                className="
                  mb-4 text-sm font-bold
                  uppercase tracking-wide
                  text-slate-900
                  dark:text-white
                "
              >
                Informations du compte
              </h3>

              <div className="grid gap-5 md:grid-cols-2">

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="
                      mb-2 block text-sm font-medium
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    Adresse email
                  </label>

                  <div className="relative">

                    <Mail
                      className="
                        absolute left-3 top-1/2
                        size-4 -translate-y-1/2
                        text-slate-400
                      "
                    />

                    <input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="
                        h-11 w-full rounded-xl
                        border border-slate-200
                        bg-slate-100
                        pl-10 pr-4
                        text-sm text-slate-500
                        outline-none

                        dark:border-white/10
                        dark:bg-white/[0.03]
                        dark:text-slate-500
                      "
                    />

                  </div>

                  <p
                    className="
                      mt-1.5 text-xs
                      text-slate-400
                      dark:text-slate-500
                    "
                  >
                    L'adresse email ne peut pas être modifiée.
                  </p>

                </div>

                {/* ROLE */}

                <div>

                  <label
                    htmlFor="role"
                    className="
                      mb-2 block text-sm font-medium
                      text-slate-700
                      dark:text-slate-200
                    "
                  >
                    Rôle
                  </label>

                  <div className="relative">

                    <Shield
                      className="
                        absolute left-3 top-1/2
                        size-4 -translate-y-1/2
                        text-slate-400
                      "
                    />

                    <input
                      id="role"
                      type="text"
                      value={user.role || ''}
                      disabled
                      className="
                        h-11 w-full rounded-xl
                        border border-slate-200
                        bg-slate-100
                        pl-10 pr-4
                        text-sm capitalize
                        text-slate-500
                        outline-none

                        dark:border-white/10
                        dark:bg-white/[0.03]
                        dark:text-slate-500
                      "
                    />

                  </div>

                  <p
                    className="
                      mt-1.5 text-xs
                      text-slate-400
                      dark:text-slate-500
                    "
                  >
                    Le rôle est géré par l'administration.
                  </p>

                </div>

              </div>

            </div>

            {/* BUTTON */}

            <div
              className="
                flex justify-end
                border-t border-slate-200
                pt-6
                dark:border-white/10
              "
            >

              <button
                type="submit"
                disabled={loading}
                className="
                  flex h-11
                  items-center justify-center
                  gap-2
                  rounded-xl
                  bg-[#FF6B0B]
                  px-6
                  text-sm font-semibold
                  text-white
                  shadow-lg
                  shadow-[#FF6B0B]/20
                  transition-all

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

export default Profile

