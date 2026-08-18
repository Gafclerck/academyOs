import { z } from 'zod'

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Adresse email invalide'),

  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
})

export type LoginFormValues =
  z.infer<typeof loginSchema>

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

export const registerSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long'),

  last_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long'),

  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Adresse email invalide'),

  phone_number: z
    .string()
    .optional()
    .or(z.literal('')),

  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(
      /[A-Z]/,
      'Au moins une lettre majuscule',
    )
    .regex(
      /[0-9]/,
      'Au moins un chiffre',
    ),

  confirm_password: z
    .string()
    .min(1, 'La confirmation est requise'),
}).refine(
  (data) =>
    data.password === data.confirm_password,
  {
    message:
      'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  },
)

export type RegisterFormValues =
  z.infer<typeof registerSchema>

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Adresse email invalide'),
})

export type ForgotPasswordFormValues =
  z.infer<typeof forgotPasswordSchema>

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Adresse email invalide'),

  code: z
    .string()
    .regex(
      /^\d{6}$/,
      'Le code doit contenir exactement 6 chiffres',
    ),

  new_password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(
      /[A-Z]/,
      'Au moins une lettre majuscule',
    )
    .regex(
      /[0-9]/,
      'Au moins un chiffre',
    ),

  confirm_password: z
    .string()
    .min(1, 'La confirmation est requise'),
}).refine(
  (data) =>
    data.new_password === data.confirm_password,
  {
    message:
      'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  },
)

export type ResetPasswordFormValues =
  z.infer<typeof resetPasswordSchema>

// ─────────────────────────────────────────────
// PASSWORD STRENGTH
// ─────────────────────────────────────────────

export function getPasswordStrength(
  password: string,
): {
  score: number
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    {
      label: 'Très faible',
      color: 'bg-red-500',
    },
    {
      label: 'Faible',
      color: 'bg-orange-500',
    },
    {
      label: 'Moyen',
      color: 'bg-yellow-500',
    },
    {
      label: 'Fort',
      color: 'bg-blue-500',
    },
    {
      label: 'Très fort',
      color: 'bg-emerald-500',
    },
  ]

  const index = Math.min(
    score,
    levels.length - 1,
  )

  return {
    score,
    ...levels[index],
  }
}