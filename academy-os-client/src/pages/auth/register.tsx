import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import ThemeToggle from '@/components/theme-toggle'

import logoXarala from '@/assets/logo-xarala.png'

import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  Phone,
} from 'lucide-react'

import {
  registerSchema,
  type RegisterFormValues,
  getPasswordStrength,
} from '@/lib/schemas'

import useRegister from '@/hooks/auth/useRegister'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { handleRegister, loading } = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  const passwordValue = watch('password', '')
  const strength = getPasswordStrength(passwordValue)

  const isLoading = loading || isSubmitting

  const onSubmit = async (
    data: RegisterFormValues,
  ) => {
    await handleRegister(data)
  }

  return (
    <main
      className="
        relative flex min-h-screen w-full overflow-hidden
        bg-white text-slate-900
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

        {/* Orange glow */}

        <motion.div
          className="
            absolute -left-40 -top-40
            h-[500px] w-[500px]
            rounded-full
            bg-[#FF6B0B]/10
            blur-3xl
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

        {/* Second orange glow */}

        <motion.div
          className="
            absolute -bottom-40 -right-40
            h-[550px] w-[550px]
            rounded-full
            bg-[#FF6B0B]/10
            blur-3xl
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
          bg-slate-100
          p-4 backdrop-blur-md
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
          bg-slate-100
          p-4 backdrop-blur-md
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
          bg-slate-100
          p-4 backdrop-blur-md
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
              LOGO XARALA
          ═════════════════════════════════════════ */}

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
              REGISTER CARD
          ═════════════════════════════════════════ */}

          <motion.div
            variants={itemVariants}
            className="
              relative overflow-hidden
              rounded-3xl
              border border-slate-200
              bg-white
              p-6
              shadow-xl
              shadow-slate-200/50
              backdrop-blur-2xl
              transition-colors duration-300
              dark:border-white/10
              dark:bg-white/[0.06]
              dark:shadow-black/30
              sm:p-8
            "
          >

            {/* Card decorations */}

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

            {/* HEADER */}

            <motion.div
              variants={itemVariants}
              className="relative mb-8 text-center"
            >

              <h2
                className="
                  text-2xl font-bold tracking-tight
                  text-slate-900
                  dark:text-white
                "
              >
                Créer votre compte
              </h2>

              <p
                className="
                  mt-2 text-sm leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Rejoignez Xarala et commencez votre parcours
              </p>

            </motion.div>

            {/* FORM */}

            <motion.form
              variants={containerVariants}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="relative space-y-5"
            >

              {/* FIRST NAME */}

              <motion.div variants={itemVariants}>

                <Label
                  htmlFor="first_name"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Prénom
                </Label>

                <div className="group relative">

                  <User
                    className="
                      absolute left-4 top-1/2 z-10
                      size-4 -translate-y-1/2
                      text-slate-400
                      transition-colors duration-200
                      group-focus-within:text-[#FF6B0B]
                      dark:text-slate-500
                    "
                  />

                  <Input
                    id="first_name"
                    type="text"
                    placeholder="Votre prénom"
                    autoComplete="given-name"
                    disabled={isLoading}
                    {...register('first_name')}
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
                        errors.first_name
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
                          : ''
                      }
                    `}
                  />

                </div>

                {errors.first_name && (
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
                    {errors.first_name.message}
                  </motion.p>
                )}

              </motion.div>

              {/* LAST NAME */}

              <motion.div variants={itemVariants}>

                <Label
                  htmlFor="last_name"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Nom
                </Label>

                <div className="group relative">

                  <User
                    className="
                      absolute left-4 top-1/2 z-10
                      size-4 -translate-y-1/2
                      text-slate-400
                      transition-colors duration-200
                      group-focus-within:text-[#FF6B0B]
                      dark:text-slate-500
                    "
                  />

                  <Input
                    id="last_name"
                    type="text"
                    placeholder="Votre nom"
                    autoComplete="family-name"
                    disabled={isLoading}
                    {...register('last_name')}
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
                        errors.last_name
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
                          : ''
                      }
                    `}
                  />

                </div>

                {errors.last_name && (
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
                    {errors.last_name.message}
                  </motion.p>
                )}

              </motion.div>

              {/* EMAIL */}

              <motion.div variants={itemVariants}>

                <Label
                  htmlFor="email"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Adresse email
                </Label>

                <div className="group relative">

                  <Mail
                    className="
                      absolute left-4 top-1/2 z-10
                      size-4 -translate-y-1/2
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
                    disabled={isLoading}
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

              {/* PHONE */}

              <motion.div variants={itemVariants}>

                <Label
                  htmlFor="phone_number"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Téléphone
                </Label>

                <div className="group relative">

                  <Phone
                    className="
                      absolute left-4 top-1/2 z-10
                      size-4 -translate-y-1/2
                      text-slate-400
                      transition-colors duration-200
                      group-focus-within:text-[#FF6B0B]
                      dark:text-slate-500
                    "
                  />

                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="Votre numéro de téléphone"
                    autoComplete="tel"
                    disabled={isLoading}
                    {...register('phone_number')}
                    className="
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
                    "
                  />

                </div>

                {errors.phone_number && (
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
                    {errors.phone_number.message}
                  </motion.p>
                )}

              </motion.div>

              {/* PASSWORD */}

              <motion.div variants={itemVariants}>

                <Label
                  htmlFor="password"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Mot de passe
                </Label>

                <div className="group relative">

                  <Lock
                    className="
                      absolute left-4 top-1/2 z-10
                      size-4 -translate-y-1/2
                      text-slate-400
                      transition-colors duration-200
                      group-focus-within:text-[#FF6B0B]
                      dark:text-slate-500
                    "
                  />

                  <Input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...register('password')}
                    className={`
                      h-12 rounded-xl
                      border-slate-200
                      bg-slate-50
                      pl-11 pr-12
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
                        errors.password
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
                          : ''
                      }
                    `}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    disabled={isLoading}
                    className="
                      absolute right-2 top-1/2
                      flex -translate-y-1/2
                      items-center justify-center
                      rounded-lg p-2
                      text-slate-400
                      transition-all duration-200
                      hover:bg-slate-100
                      hover:text-slate-900
                      dark:text-slate-500
                      dark:hover:bg-white/5
                      dark:hover:text-white
                    "
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

                {/* PASSWORD STRENGTH */}

                {passwordValue.length > 0 && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                    }}
                    className="mt-3"
                  >

                    <div className="flex gap-1.5">

                      {Array.from({
                        length: 5,
                      }).map((_, index) => (
                        <motion.div
                          key={index}
                          initial={{
                            scaleX: 0,
                          }}
                          animate={{
                            scaleX: 1,
                          }}
                          transition={{
                            delay: index * 0.05,
                          }}
                          className={`
                            h-1.5 flex-1
                            origin-left rounded-full
                            ${
                              index < strength.score
                                ? strength.color
                                : 'bg-slate-200 dark:bg-white/10'
                            }
                          `}
                        />
                      ))}

                    </div>

                    <div
                      className="
                        mt-1.5 flex
                        items-center
                        justify-between
                      "
                    >

                      <span
                        className="
                          text-xs
                          text-slate-400
                          dark:text-slate-500
                        "
                      >
                        Sécurité du mot de passe
                      </span>

                      <span
                        className="
                          text-xs font-medium
                          text-slate-600
                          dark:text-slate-300
                        "
                      >
                        {strength.label}
                      </span>

                    </div>

                  </motion.div>
                )}

                {errors.password && (
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
                    {errors.password.message}
                  </motion.p>
                )}

              </motion.div>

              {/* CONFIRM PASSWORD */}

              <motion.div variants={itemVariants}>

                <Label
                  htmlFor="confirm_password"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  Confirmer le mot de passe
                </Label>

                <div className="group relative">

                  <Lock
                    className="
                      absolute left-4 top-1/2 z-10
                      size-4 -translate-y-1/2
                      text-slate-400
                      transition-colors duration-200
                      group-focus-within:text-[#FF6B0B]
                      dark:text-slate-500
                    "
                  />

                  <Input
                    id="confirm_password"
                    type={
                      showConfirm
                        ? 'text'
                        : 'password'
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...register('confirm_password')}
                    className={`
                      h-12 rounded-xl
                      border-slate-200
                      bg-slate-50
                      pl-11 pr-12
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
                        errors.confirm_password
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
                          : ''
                      }
                    `}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirm(
                        (value) => !value,
                      )
                    }
                    disabled={isLoading}
                    className="
                      absolute right-2 top-1/2
                      flex -translate-y-1/2
                      items-center justify-center
                      rounded-lg p-2
                      text-slate-400
                      transition-all duration-200
                      hover:bg-slate-100
                      hover:text-slate-900
                      dark:text-slate-500
                      dark:hover:bg-white/5
                      dark:hover:text-white
                    "
                    aria-label={
                      showConfirm
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>

                </div>

                {errors.confirm_password && (
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
                    {errors.confirm_password.message}
                  </motion.p>
                )}

              </motion.div>

              {/* SUBMIT */}

              <motion.div
                variants={itemVariants}
                className="pt-1"
              >

                <Button
                  type="submit"
                  disabled={isLoading}
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

                  {!isLoading && (
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
                        x: [
                          '-100%',
                          '200%',
                        ],
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
                      relative flex
                      items-center
                      justify-center
                    "
                  >

                    {isLoading ? (
                      <>
                        <Loader2
                          className="
                            mr-2 size-4
                            animate-spin
                          "
                        />

                        Création du compte...
                      </>
                    ) : (
                      <>
                        Créer mon compte

                        <ArrowRight
                          className="
                            ml-2 size-4
                            transition-transform duration-300
                            group-hover:translate-x-1
                          "
                        />
                      </>
                    )}

                  </span>

                </Button>

              </motion.div>

            </motion.form>

            {/* TERMS */}

            <motion.p
              variants={itemVariants}
              className="
                mt-6
                text-center
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              En créant un compte, vous acceptez nos{' '}

              <Link
                to="/terms"
                className="
                  text-[#FF6B0B]
                  transition-colors
                  hover:text-orange-500
                  dark:hover:text-orange-300
                "
              >
                Conditions d'utilisation
              </Link>

              {' '}et notre{' '}

              <Link
                to="/privacy"
                className="
                  text-[#FF6B0B]
                  transition-colors
                  hover:text-orange-500
                  dark:hover:text-orange-300
                "
              >
                Politique de confidentialité
              </Link>
            </motion.p>

            {/* DIVIDER */}

            <motion.div
              variants={itemVariants}
              className="
                mt-7 flex items-center gap-3
              "
            >

              <div
                className="
                  h-px flex-1
                  bg-slate-200
                  dark:bg-white/10
                "
              />

              <span
                className="
                  text-xs
                  text-slate-400
                  dark:text-slate-600
                "
              >
                OU
              </span>

              <div
                className="
                  h-px flex-1
                  bg-slate-200
                  dark:bg-white/10
                "
              />

            </motion.div>

            {/* LOGIN */}

            <motion.p
              variants={itemVariants}
              className="
                mt-6
                text-center
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Vous avez déjà un compte ?{' '}

              <Link
                to="/login"
                className="
                  font-semibold
                  text-[#FF6B0B]
                  transition-colors duration-200
                  hover:text-orange-500
                  dark:hover:text-orange-300
                "
              >
                Se connecter
              </Link>

            </motion.p>

          </motion.div>

          {/* ═════════════════════════════════════════
              FOOTER
          ═════════════════════════════════════════ */}

          <motion.div
            variants={itemVariants}
            className="mt-6 text-center"
          >

            <div
              className="
                flex items-center
                justify-center gap-1.5
              "
            >

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
                Inscription sécurisée
              </p>

            </div>

            <p
              className="
                mt-1 text-xs
                text-slate-500
                dark:text-slate-700
              "
            >
              © {new Date().getFullYear()} Xarala
            </p>

            <p
              className="
                mt-1 text-xs
                text-slate-500
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

export default Register