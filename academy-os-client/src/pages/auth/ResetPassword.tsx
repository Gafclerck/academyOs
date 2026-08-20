
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
} from 'lucide-react'

import ThemeToggle from '@/components/theme-toggle'
import logoXarala from '@/assets/logo-xarala.png'

import { resetPassword } from '@/services/auth/resetPassword'

// ─────────────────────────────────────────────
// ANIMATIONS
// ─────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 25,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const floatingVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    rotate: [-2, 2, -2],

    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const ResetPassword = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')

    // Vérification des champs
    if (
      !email.trim() ||
      !code.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    // Vérification de l'email
    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide.')
      return
    }

    // Vérification du code
    if (code.length !== 6) {
      setError('Le code doit contenir 6 chiffres.')
      return
    }

    // Vérification des mots de passe
    if (password !== confirmPassword) {
      setError(
        'Les deux mots de passe ne correspondent pas.',
      )
      return
    }

    if (password.length < 8) {
      setError(
        'Le mot de passe doit contenir au moins 8 caractères.',
      )
      return
    }

    try {
      setLoading(true)

      // Appel de l'endpoint reset-password
      await resetPassword({
        email: email.trim(),
        code: code.trim(),
        new_password: password,
      })

      // Reset réussi
      setSuccess(true)

      // Retour vers la connexion après 2 secondes
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      console.error(
        'Erreur reset password :',
        err,
      )

      const data = err?.response?.data

      setError(
        data?.detail ||
          data?.email?.[0] ||
          data?.code?.[0] ||
          data?.new_password?.[0] ||
          'Le code est invalide ou expiré.',
      )
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-slate-50 transition-colors duration-500 dark:bg-[#19192D]">

      {/* THEME TOGGLE */}

      <div className="fixed right-5 top-5 z-50">
        <ThemeToggle />
      </div>

      {/* BACKGROUND */}

      <div className="absolute inset-0">

        <motion.div
          className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#FF6B0B]/10 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="absolute -bottom-40 -right-40 h-[550px] w-[550px] rounded-full bg-[#FF6B0B]/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,100,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.5) 1px, transparent 1px)',
            backgroundSize: '45px 45px',
          }}
        />

      </div>

      {/* FLOATING ICONS */}

      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute left-[8%] top-[20%] hidden rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] lg:block"
      >
        <BookOpen className="size-6 text-[#FF6B0B]" />
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute right-[10%] top-[18%] hidden rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] lg:block"
      >
        <Award className="size-6 text-[#FF6B0B]" />
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute bottom-[18%] left-[12%] hidden rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] lg:block"
      >
        <Users className="size-6 text-green-500 dark:text-green-400" />
      </motion.div>

      {/* CONTENT */}

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center overflow-y-auto px-4 py-10">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[440px]"
        >

          {/* LOGO */}

          <motion.div
            variants={itemVariants}
            className="mb-8 text-center"
          >

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mb-5 flex justify-center"
            >
              <img
                src={logoXarala}
                alt="Logo Xarala"
                className="h-auto w-[220px] object-contain"
              />
            </motion.div>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              La technologie dans votre langue.
            </p>

          </motion.div>

          {/* CARD */}

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/30 transition-colors duration-500 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/30 dark:backdrop-blur-2xl sm:p-8"
          >

            {/* Décoration */}

            <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#FF6B0B]/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#FF6B0B]/5 blur-3xl" />

            {/* SUCCESS */}

            {success ? (

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative py-8 text-center"
              >

                <motion.div
                  variants={itemVariants}
                  className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10"
                >
                  <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-2xl font-bold text-slate-900 dark:text-white"
                >
                  Mot de passe réinitialisé !
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400"
                >
                  Votre mot de passe a été modifié
                  avec succès.
                  <br />
                  Vous allez être redirigé vers la
                  page de connexion.
                </motion.p>

                <motion.div
                  variants={itemVariants}
                  className="mt-6 flex justify-center"
                >
                  <Loader2 className="size-5 animate-spin text-[#FF6B0B]" />
                </motion.div>

              </motion.div>

            ) : (

              <>

                {/* HEADER */}

                <motion.div
                  variants={itemVariants}
                  className="relative mb-8 text-center"
                >

                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#FF6B0B]/10">
                    <KeyRound className="size-7 text-[#FF6B0B]" />
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Réinitialiser votre mot de passe
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Entrez le code reçu par email
                    pour définir un nouveau mot de passe.
                  </p>

                </motion.div>

                {/* ERROR */}

                {error && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="relative mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                {/* FORM */}

                <motion.form
                  variants={containerVariants}
                  onSubmit={handleSubmit}
                  noValidate
                  className="relative space-y-5"
                >

                  {/* EMAIL */}

                  <motion.div variants={itemVariants}>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Adresse email
                    </label>

                    <div className="group relative">

                      <Mail className="absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#FF6B0B] dark:text-slate-500" />

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#FF6B0B]/60 focus:bg-white focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-white/[0.08]"
                      />

                    </div>

                  </motion.div>

                  {/* CODE */}

                  <motion.div variants={itemVariants}>

                    <label
                      htmlFor="code"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Code reçu par email
                    </label>

                    <div className="group relative">

                      <KeyRound className="absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#FF6B0B] dark:text-slate-500" />

                      <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(event) =>
                          setCode(
                            event.target.value.replace(
                              /\D/g,
                              '',
                            ),
                          )
                        }
                        placeholder="483921"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm tracking-[0.3em] text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#FF6B0B]/60 focus:bg-white focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-white/[0.08]"
                      />

                    </div>

                  </motion.div>

                  {/* PASSWORD */}

                  <motion.div variants={itemVariants}>

                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Nouveau mot de passe
                    </label>

                    <div className="group relative">

                      <Lock className="absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#FF6B0B] dark:text-slate-500" />

                      <input
                        id="password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#FF6B0B]/60 focus:bg-white focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-white/[0.08]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (value) => !value,
                          )
                        }
                        disabled={loading}
                        className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white"
                        aria-label={
                          showPassword
                            ? 'Masquer le mot de passe'
                            : 'Afficher le mot de passe'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>

                    </div>

                  </motion.div>

                  {/* CONFIRMATION */}

                  <motion.div variants={itemVariants}>

                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Confirmer le mot de passe
                    </label>

                    <div className="group relative">

                      <Lock className="absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#FF6B0B] dark:text-slate-500" />

                      <input
                        id="confirmPassword"
                        type={
                          showConfirm
                            ? 'text'
                            : 'password'
                        }
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(
                            event.target.value,
                          )
                        }
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#FF6B0B]/60 focus:bg-white focus:ring-4 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:focus:bg-white/[0.08]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirm(
                            (value) => !value,
                          )
                        }
                        disabled={loading}
                        className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white"
                        aria-label={
                          showConfirm
                            ? 'Masquer la confirmation'
                            : 'Afficher la confirmation'
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>

                    </div>

                  </motion.div>

                  {/* BUTTON */}

                  <motion.div variants={itemVariants}>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-[#FF6B0B] font-semibold text-white shadow-lg shadow-[#FF6B0B]/20 transition-all duration-300 hover:scale-[1.01] hover:bg-[#ff7a24] hover:shadow-[#FF6B0B]/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {!loading && (
                        <motion.span
                          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ['-100%', '200%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                        />
                      )}

                      <span className="relative flex items-center justify-center">

                        {loading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Réinitialisation en cours...
                          </>
                        ) : (
                          <>
                            Réinitialiser mon mot de passe
                            <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </>
                        )}

                      </span>

                    </button>

                  </motion.div>

                </motion.form>

                {/* LOGIN */}

                <motion.p
                  variants={itemVariants}
                  className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Vous vous souvenez de votre mot de passe ?{' '}

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-semibold text-[#FF6B0B] transition-colors duration-200 hover:text-orange-500 dark:hover:text-orange-300"
                  >
                    Se connecter
                  </button>

                </motion.p>

              </>
            )}

          </motion.div>

          {/* FOOTER */}

          <motion.div
            variants={itemVariants}
            className="mt-6 text-center"
          >

            <p className="text-xs text-slate-500 dark:text-slate-600">
              © {new Date().getFullYear()} Xarala
            </p>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-700">
              La technologie dans votre langue.
            </p>

          </motion.div>

        </motion.div>

      </div>

    </main>
  )
}

export default ResetPassword

