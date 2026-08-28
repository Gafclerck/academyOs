import { z } from 'zod'

// ─── 1. Schéma Création Programme ─────────────────────────────────────────────

export const createProgrammeSchema = z.object({
  nom: z
    .string()
    .min(3, 'Le nom du programme doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  duree_mois: z.coerce
    .number({ invalid_type_error: 'La durée doit être un nombre' })
    .int('La durée doit être un nombre entier')
    .min(1, 'La durée minimale est de 1 mois')
    .max(36, 'La durée maximale est de 36 mois')
    .optional(),
  statut: z.enum(['actif', 'inactif'], {
    required_error: 'Veuillez sélectionner un statut',
  }),
})

export type CreateProgrammeFormValues = z.infer<typeof createProgrammeSchema>
