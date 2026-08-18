import { z } from 'zod';

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
    .max(36, 'La durée maximale est de 36 mois'),
  statut: z.enum(['actif', 'inactif'], {
    required_error: 'Veuillez sélectionner un statut',
  }),
});

export type CreateProgrammeFormValues = z.infer<typeof createProgrammeSchema>;

// ─── 2. Schéma Création Rentrée ───────────────────────────────────────────────

export const createRentreeSchema = z
  .object({
    programme_id: z.string().min(1, 'Le programme parent est obligatoire'),
    nom: z
      .string()
      .min(3, 'Le nom de la rentrée doit contenir au moins 3 caractères')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    description: z
      .string()
      .max(500, 'La description ne peut pas dépasser 500 caractères')
      .optional(),
    date_debut: z
      .string()
      .min(1, 'La date de début est requise')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ'),
    date_fin: z
      .string()
      .min(1, 'La date de fin est requise')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ'),
  })
  .refine(
    (data) => {
      if (!data.date_debut || !data.date_fin) return true;
      return new Date(data.date_debut) < new Date(data.date_fin);
    },
    {
      message: 'La date de fin doit être postérieure à la date de début',
      path: ['date_fin'],
    }
  );

export type CreateRentreeFormValues = z.infer<typeof createRentreeSchema>;

/** @deprecated Utiliser createRentreeSchema */
export const createSessionSchema = createRentreeSchema;
/** @deprecated Utiliser CreateRentreeFormValues */
export type CreateSessionFormValues = CreateRentreeFormValues;

// ─── 3. Schéma Création Cohorte ───────────────────────────────────────────────

export const createCohorteSchema = z
  .object({
    rentree_id: z.string().min(1, 'La rentrée parente est obligatoire'),
    nom: z
      .string()
      .min(3, 'Le nom de la cohorte doit contenir au moins 3 caractères')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    description: z
      .string()
      .max(500, 'La description ne peut pas dépasser 500 caractères')
      .optional(),
    date_debut: z
      .string()
      .min(1, 'La date de début est requise')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ'),
    date_fin: z
      .string()
      .min(1, 'La date de fin est requise')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ'),
  })
  .refine(
    (data) => {
      if (!data.date_debut || !data.date_fin) return true;
      return new Date(data.date_debut) < new Date(data.date_fin);
    },
    {
      message: 'La date de fin doit être postérieure à la date de début',
      path: ['date_fin'],
    }
  );

export type CreateCohorteFormValues = z.infer<typeof createCohorteSchema>;
