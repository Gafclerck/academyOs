import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCreateCohorte } from '@/hooks/cohortes/useCohortes';
import { useProgrammes } from '@/hooks/useProgrammes';
import { useRentrees } from '@/hooks/rentrees/useRentrees';
import type { CreateCohorteDTO } from '@/types/cohorte';

// ============================================================
// SCHEMA
// ============================================================

const cohorteSchema = z
  .object({
    name: z.string().trim().min(1, 'Le nom de la cohorte est obligatoire.'),
    description: z.string().optional(),
    program: z.string().min(1, 'Le programme est obligatoire.'),
    intake: z.string().min(1, 'La rentrée est obligatoire.'),
    start_date: z.string().min(1, 'La date de début est obligatoire.'),
    end_date: z.string().min(1, 'La date de fin est obligatoire.'),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'active', 'inactive']),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'La date de fin doit être postérieure ou égale à la date de début.',
    path: ['end_date'],
  });

type CohorteFormData = z.infer<typeof cohorteSchema>;

// ============================================================
// PAGE
// ============================================================

export const CohorteCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Programme pré-sélectionné (arrivée depuis la page de détail du programme).
  const preselectedProgram = searchParams.get('program') ?? '';

  // ── Mutation ────────────────────────────────────────────────
  const createCohorteMutation = useCreateCohorte();

  // ── Programmes ──────────────────────────────────────────────
  const {
    data: programmes = [],
    isLoading: programmesLoading,
    isError: programmesError,
  } = useProgrammes();

  // ── Rentrées ────────────────────────────────────────────────
  const {
    data: rentrees = [],
    isLoading: rentreesLoading,
    isError: rentreesError,
  } = useRentrees();

  // ── Formulaire ──────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CohorteFormData>({
    resolver: zodResolver(cohorteSchema),
    defaultValues: {
      name: '',
      description: '',
      program: preselectedProgram,
      intake: '',
      start_date: '',
      end_date: '',
      status: 'upcoming',
    },
  });

  // ── Valeurs sélectionnées ───────────────────────────────────
  const selectedProgram = watch('program');
  const selectedIntake = watch('intake');

  // ── États dérivés ───────────────────────────────────────────
  const loadingReferences = programmesLoading || rentreesLoading;
  const referencesError = programmesError || rentreesError;

  // ── Soumission ──────────────────────────────────────────────
  const onSubmit = async (data: CohorteFormData) => {
    try {
      const payload: CreateCohorteDTO = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        program: data.program,
        intake: data.intake,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
      };
;

      await createCohorteMutation.mutateAsync(payload);

      toast.success('Cohorte créée avec succès.');
      navigate(preselectedProgram ? `/programmes/${preselectedProgram}` : '/cohortes');
    } catch (error: any) {
      console.error('Erreur création cohorte :', error);

      const apiError = error?.response?.data;

      toast.error(
        apiError?.detail ||
          apiError?.message ||
          apiError?.name?.[0] ||
          apiError?.program?.[0] ||
          apiError?.intake?.[0] ||
          apiError?.start_date?.[0] ||
          apiError?.end_date?.[0] ||
          apiError?.status?.[0] ||
          'Impossible de créer la cohorte.',
      );
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/cohortes')}
          disabled={createCohorteMutation.isPending}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#FF6B0B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="size-4" />
          Retour aux cohortes
        </button>

        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#FF6B0B]/10">
            <Users className="size-5 text-[#FF6B0B]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Nouvelle cohorte
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Créez une nouvelle cohorte académique.
            </p>
          </div>
        </div>
      </div>

      {/* ERREUR PROGRAMMES / RENTRÉES */}
      {referencesError && (
        <div className="mx-auto flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Impossible de charger les données nécessaires.
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-300">
              Vérifiez que les API des programmes et des rentrées sont disponibles.
            </p>
          </div>
        </div>
      )}

      {/* FORMULAIRE */}
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#151528] sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* NOM */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nom de la cohorte
            </label>
            <input
              id="name"
              type="text"
              placeholder="Ex : Cohorte Octobre 2026"
              disabled={createCohorteMutation.isPending}
              {...register('name')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Décrivez brièvement cette cohorte..."
              disabled={createCohorteMutation.isPending}
              {...register('description')}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          {/* PROGRAMME */}
          <div>
            <label htmlFor="program" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Programme
            </label>
            <select
              id="program"
              value={selectedProgram}
              disabled={loadingReferences || createCohorteMutation.isPending || Boolean(preselectedProgram)}
              onChange={(event) => setValue('program', event.target.value, { shouldValidate: true })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f38] dark:text-white"
            >
              <option value="">
                {programmesLoading ? 'Chargement des programmes...' : 'Sélectionnez un programme'}
              </option>
              {programmes.map((programme) => (
                <option key={programme.id} value={programme.id}>
                  {programme.nom}
                  {programme.statut ? ` (${programme.statut})` : ''}
                </option>
              ))}
            </select>
            {errors.program && <p className="mt-1.5 text-xs text-red-500">{errors.program.message}</p>}
            {preselectedProgram && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Programme fixé depuis la page programme.
              </p>
            )}
          </div>

          {/* RENTRÉE */}
          <div>
            <label htmlFor="intake" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Rentrée
            </label>
            <select
              id="intake"
              value={selectedIntake}
              disabled={loadingReferences || createCohorteMutation.isPending}
              onChange={(event) => setValue('intake', event.target.value, { shouldValidate: true })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f38] dark:text-white"
            >
              <option value="">
                {rentreesLoading ? 'Chargement des rentrées...' : 'Sélectionnez une rentrée'}
              </option>
              {rentrees.map((rentree) => (
                <option key={rentree.id} value={rentree.id}>
                  {rentree.name}
                  {rentree.status ? ` (${rentree.status})` : ''}
                </option>
              ))}
            </select>
            {errors.intake && <p className="mt-1.5 text-xs text-red-500">{errors.intake.message}</p>}
          </div>

          {/* DATES */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Date de début
              </label>
              <input
                id="start_date"
                type="date"
                disabled={createCohorteMutation.isPending}
                {...register('start_date')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {errors.start_date && <p className="mt-1.5 text-xs text-red-500">{errors.start_date.message}</p>}
            </div>

            <div>
              <label htmlFor="end_date" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Date de fin
              </label>
              <input
                id="end_date"
                type="date"
                disabled={createCohorteMutation.isPending}
                {...register('end_date')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {errors.end_date && <p className="mt-1.5 text-xs text-red-500">{errors.end_date.message}</p>}
            </div>
          </div>

          {/* STATUT */}
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Statut
            </label>
            <select
              id="status"
              disabled={createCohorteMutation.isPending}
              {...register('status')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B0B] focus:ring-2 focus:ring-[#FF6B0B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#1f1f38] dark:text-white"
            >
              <option value="upcoming">À venir</option>
              <option value="ongoing">En cours</option>
              <option value="completed">Terminée</option>
              
            </select>
            {errors.status && <p className="mt-1.5 text-xs text-red-500">{errors.status.message}</p>}
          </div>

          {/* ERREUR API */}
          {createCohorteMutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">La création a échoué</p>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                    Vérifiez les informations saisies et réessayez.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-white/10">
            <button
              type="button"
              onClick={() => navigate(preselectedProgram ? `/programmes/${preselectedProgram}` : '/cohortes')}
              disabled={createCohorteMutation.isPending}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={createCohorteMutation.isPending || loadingReferences}
              className="flex items-center gap-2 rounded-xl bg-[#FF6B0B] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B0B]/20 transition hover:bg-[#e85f08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createCohorteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Créer la cohorte
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CohorteCreatePage;