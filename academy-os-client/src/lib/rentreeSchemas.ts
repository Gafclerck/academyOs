import { z } from 'zod'

export const createRentreeSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom de la rentrée doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  start_date: z
    .string()
    .min(1, 'La date de début est requise')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ'),
  status: z.enum(['upcoming', 'ongoing', 'completed'], {
    required_error: 'Veuillez sélectionner un statut',
  }),
})

export type CreateRentreeFormValues = z.infer<typeof createRentreeSchema>
