
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'

import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
} from 'lucide-react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ThemeToggle from '@/components/theme-toggle'

import logoXarala from '@/assets/logo-xarala.png'

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/schemas'

import { forgotPassword } from '@/services/auth/forgotPassword'

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

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  })

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────

  const onSubmit = async (
    data: ForgotPasswordFormValues,
  ) => {
    setLoading(true)
    setApiError('')

    try {
      await forgotPassword({
        email: data.email.trim(),
      })

      setSubmitted(true)
    } catch (err: any) {
      console.error(
        'Erreur forgot password :',
        err,
      )

      const responseData = err?.response?.data

      setApiError(
        responseData?.detail ||
          responseData?.email?.[0] ||
          "Une erreur s'est produite. Veuillez réessayer.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="
        relative flex min-h-screen w-full overflow-hidden
        bg-slate-50 text-slate-900
        transition-colors duration-300
        dark:bg-[#19192D] dark:text-white
      "
    >
      {/* ═══════════════════════════════════════════
          THEME TOGGLE
      ═══════════════════════════════════════════ */}

      <div className="fixed right-5 top-5 z-50">
        <ThemeToggle />
      </div>

      {/* ═══════════════════════════════════════════
          BACKGROUND
      ═══════════════════════════════════════════ */}

      <div className="absolute inset-0">

        {/* Orange glow gauche */}

        <motion.div
          className="
            absolute -left-40 -top-40
            h-[500px] w-[500px]
            rounded-full
            bg-[#FF6B0B]/10
            blur-3xl
            dark:bg-[#FF6B0B]/10
          "
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

        {/* Orange glow droite */}

        <motion.div
          className="
            absolute -bottom-40 -right-40
            h-[550px] w-[550px]
            rounded-full
            bg-[#FF6B0B]/5
            blur-3xl
            dark:bg-[#FF6B0B]/10
          "
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

        {/* Grid */}

        <div
          className="
            absolute inset-0
            opacity-[0.025]
            dark:opacity-[0.025]
          "
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,100,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.5) 1px, transparent 1px)',
            backgroundSize: '45px 45px',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════
          FLOATING ICONS
      ═══════════════════════════════════════════ */}

      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="
          absolute left-[8%] top-[20%]
          hidden rounded-2xl
          border border-slate-200
          bg-white/70
          p-4
          shadow-sm
          backdrop-blur-md
          dark:border-white/10
          dark:bg-white/[0.04]
          lg:block
        "
      >
        <BookOpen className="size-6 text-[#FF6B0B]" />
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="
          absolute right-[10%] top-[18%]
          hidden rounded-2xl
          border border-slate-200
          bg-white/70
          p-4
          shadow-sm
          backdrop-blur-md
          dark:border-white/10
          dark:bg-white/[0.04]
          lg:block
        "
      >
        <Award className="size-6 text-[#FF6B0B]" />
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="
          absolute bottom-[18%] left-[12%]
          hidden rounded-2xl
          border border-slate-200
          bg-white/70
          p-4
          shadow-sm
          backdrop-blur-md
          dark:border-white/10
          dark:bg-white/[0.04]
          lg:block
        "
      >
        <Users className="size-6 text-green-500 dark:text-green-400" />
      </motion.div>

      {/* ═══════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════ */}

      <div
        className="
          relative z-10
          flex min-h-screen w-full
          items-center justify-center
          overflow-y-auto
          px-4 py-10
        "
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[440px]"
        >

          {/* ═════════════════════════════════════════
              LOGO
          ═════════════════════════════════════════ */}

          <motion.div
            variants={itemVariants}
            className="mb-8 text-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="
                mx-auto mb-5
                flex
                items-center
                justify-center
              "
            >
              <img
                src={logoXarala}
                alt="Logo Xarala"
                className="
                  h-auto
                  w-[180px]
                  object-contain
                "
              />
            </motion.div>

            <p
              className="
                mt-2 text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              La technologie dans votre langue.
            </p>
          </motion.div>

          {/* ═════════════════════════════════════════
              CARD
          ═════════════════════════════════════════ */}

          <motion.div
            variants={itemVariants}
            className="
              relative overflow-hidden
              rounded-3xl
              border border-slate-200
              bg-white/90
              p-6
              shadow-2xl shadow-slate-200/50
              backdrop-blur-2xl
              transition-colors duration-300
              dark:border-white/10
              dark:bg-white/[0.06]
              dark:shadow-black/30
              sm:p-8
            "
          >

            {/* Décorations */}

            <div
              className="
                pointer-events-none
                absolute -right-24 -top-24
                h-48 w-48
                rounded-full
                bg-[#FF6B0B]/10
                blur-3xl
              "
            />

            <div
              className="
                pointer-events-none
                absolute -bottom-24 -left-24
                h-48 w-48
                rounded-full
                bg-[#FF6B0B]/5
                blur-3xl
              "
            />

            {!submitted ? (
              <>
                {/* ═════════════════════════════════
                    HEADER
                ═════════════════════════════════ */}

                <motion.div
                  variants={itemVariants}
                  className="relative mb-8 text-center"
                >
                  <div
                    className="
                      mx-auto mb-4
                      flex h-12 w-12
                      items-center justify-center
                      rounded-xl
                      bg-[#FF6B0B]/10
                    "
                  >
                    <Mail className="size-6 text-[#FF6B0B]" />
                  </div>

                  <h2
                    className="
                      text-2xl font-bold tracking-tight
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Mot de passe oublié ?
                  </h2>

                  <p
                    className="
                      mt-2 text-sm leading-6
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Pas d&apos;inquiétude. Entrez votre
                    adresse email et nous vous enverrons
                    un code pour réinitialiser votre mot
                    de passe.
                  </p>
                </motion.div>

                {/* ═════════════════════════════════
                    API ERROR
                ═════════════════════════════════ */}

                {apiError && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="
                      relative mb-5
                      rounded-xl
                      border border-red-200
                      bg-red-50
                      p-3
                      text-sm text-red-600
                      dark:border-red-500/20
                      dark:bg-red-500/10
                      dark:text-red-400
                    "
                  >
                    {apiError}
                  </motion.div>
                )}

                {/* ═════════════════════════════════
                    FORM
                ═════════════════════════════════ */}

                <motion.form
                  variants={containerVariants}
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="relative space-y-5"
                >

                  {/* EMAIL */}

                  <motion.div variants={itemVariants}>
                    <Label
                      htmlFor="email"
                      className="
                        mb-2 block text-sm font-medium
                        text-slate-700
                        dark:text-slate-200
                      "
                    >
                      Adresse email
                    </Label>

                    <div className="group relative">

                      <Mail
                        className="
                          absolute left-4 top-1/2
                          z-10 size-4
                          -translate-y-1/2
                          text-slate-400
                          transition-colors duration-200
                          group-focus-within:text-[#FF6B0B]
                          dark:text-slate-500
                        "
                      />

                      <Input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        disabled={loading}
                        {...register('email')}
                        className={`
                          h-12 rounded-xl
                          border-slate-200
                          bg-slate-50
                          pl-11
                          text-slate-900
                          placeholder:text-slate-400
                          transition-all duration-300
                          focus:border-[#FF6B0B]/60
                          focus:bg-white
                          focus:ring-4
                          focus:ring-[#FF6B0B]/10

                          dark:border-white/10
                          dark:bg-white/5
                          dark:text-white
                          dark:placeholder:text-slate-600
                          dark:focus:bg-white/[0.08]

                          ${
                            errors.email
                              ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
                              : ''
                          }
                        `}
                      />
                    </div>

                    {errors.email && (
                      <motion.p
                        initial={{
                          opacity: 0,
                          y: -5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="
                          mt-2 text-xs
                          text-red-500
                          dark:text-red-400
                        "
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* BUTTON */}

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="
                        group relative
                        h-12 w-full
                        overflow-hidden
                        rounded-xl
                        bg-[#FF6B0B]
                        font-semibold text-white
                        shadow-lg
                        shadow-[#FF6B0B]/20
                        transition-all duration-300
                        hover:scale-[1.01]
                        hover:bg-[#ff7a24]
                        hover:shadow-[#FF6B0B]/30
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >

                      {!loading && (
                        <motion.span
                          className="
                            absolute inset-0
                            -translate-x-full
                            bg-gradient-to-r
                            from-transparent
                            via-white/20
                            to-transparent
                          "
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

                      <span
                        className="
                          relative
                          flex items-center
                          justify-center
                        "
                      >
                        {loading ? (
                          <>
                            <Loader2
                              className="
                                mr-2 size-4
                                animate-spin
                              "
                            />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            Envoyer le code

                            <ArrowRight
                              className="
                                ml-2 size-4
                                transition-transform
                                duration-300
                                group-hover:translate-x-1
                              "
                            />
                          </>
                        )}
                      </span>

                    </Button>
                  </motion.div>

                </motion.form>

                {/* BACK TO LOGIN */}

                <motion.div
                  variants={itemVariants}
                  className="mt-7 text-center"
                >
                  <Link
                    to="/login"
                    className="
                      inline-flex items-center gap-2
                      text-sm font-medium
                      text-slate-500
                      transition-colors
                      hover:text-slate-900
                      dark:text-slate-400
                      dark:hover:text-white
                    "
                  >
                    <ArrowLeft className="size-4" />
                    Retour à la connexion
                  </Link>
                </motion.div>
              </>
            ) : (

              /* ═════════════════════════════════
                 SUCCESS
              ═════════════════════════════════ */

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="relative py-4 text-center"
              >

                <motion.div
                  initial={{
                    scale: 0,
                  }}
                  animate={{
                    scale: 1,
                  }}
                  transition={{
                    delay: 0.15,
                    type: 'spring',
                    stiffness: 250,
                    damping: 15,
                  }}
                  className="
                    mx-auto mb-5
                    flex h-16 w-16
                    items-center justify-center
                    rounded-full
                    bg-green-400/10
                  "
                >
                  <CheckCircle2
                    className="
                      size-8
                      text-green-500
                      dark:text-green-400
                    "
                  />
                </motion.div>

                <h2
                  className="
                    text-2xl font-bold tracking-tight
                    text-slate-900
                    dark:text-white
                  "
                >
                  Vérifiez votre email
                </h2>

                <p
                  className="
                    mx-auto mt-3 max-w-sm
                    text-sm leading-6
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Si un compte existe avec cette adresse
                  email, vous recevrez un code pour
                  réinitialiser votre mot de passe.
                </p>

                <div
                  className="
                    mt-6
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    p-4
                    text-left
                    dark:border-white/10
                    dark:bg-white/5
                  "
                >
                  <p
                    className="
                      text-xs leading-5
                      text-slate-500
                      dark:text-slate-500
                    "
                  >
                    💡 Pensez également à vérifier votre
                    dossier
                    <span
                      className="
                        font-medium
                        text-slate-700
                        dark:text-slate-300
                      "
                    >
                      {' '}
                      spam ou courrier indésirable
                    </span>
                    {' '}
                    si vous ne trouvez pas notre email.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="
                    mt-7
                    inline-flex
                    items-center gap-2
                    text-sm font-semibold
                    text-[#FF6B0B]
                    transition-colors
                    hover:text-orange-500
                    dark:hover:text-orange-300
                  "
                >
                  <ArrowLeft className="size-4" />
                  Retour à la connexion
                </Link>

              </motion.div>
            )}

          </motion.div>

          {/* ═════════════════════════════════════════
              FOOTER
          ═════════════════════════════════════════ */}

          <motion.div
            variants={itemVariants}
            className="mt-6 text-center"
          >
            <div className="flex items-center justify-center gap-1.5">

              <CheckCircle2
                className="
                  size-3
                  text-green-500
                  dark:text-green-400
                "
              />

              <p
                className="
                  text-xs
                  text-slate-500
                  dark:text-slate-600
                "
              >
                Connexion sécurisée
              </p>

            </div>

            <p
              className="
                mt-1 text-xs
                text-slate-400
                dark:text-slate-700
              "
            >
              © {new Date().getFullYear()} Xarala
            </p>

            <p
              className="
                mt-1 text-xs
                text-slate-400
                dark:text-slate-700
              "
            >
              La technologie dans votre langue.
            </p>

          </motion.div>

        </motion.div>
      </div>
    </main>
  )
}

export default ForgotPassword

