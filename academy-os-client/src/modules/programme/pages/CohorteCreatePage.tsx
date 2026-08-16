import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  Lock,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createCohorteSchema,
  type CreateCohorteFormValues,
} from '../schemas/programmeSchemas';
import { useSession, useCreateCohorte } from '../hooks/useProgrammes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const CohorteCreatePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading: sessLoading } = useSession(sessionId);
  const createCohorteMutation = useCreateCohorte();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCohorteFormValues>({
    resolver: zodResolver(createCohorteSchema),
    defaultValues: {
      session_id: sessionId || '',
      nom: '',
      date_debut: '',
      date_fin: '',
    },
  });

  const onSubmit = async (values: CreateCohorteFormValues) => {
    try {
      const created = await createCohorteMutation.mutateAsync({
        session_id: sessionId!,
        nom: values.nom,
        date_debut: values.date_debut,
        date_fin: values.date_fin,
      });
      toast.success('Cohorte créée avec succès !', {
        description: `La cohorte "${created.nom}" a été rattachée à la session.`,
      });
      navigate(`/cohortes/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création de la cohorte.';
      toast.error('Erreur', { description: msg });
    }
  };

  if (sessLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
        <div className="h-48 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-red-500">
          Session parente introuvable.
        </p>
        <p className="text-xs text-slate-400">
          Une cohorte ne peut être créée sans session parente existante.
        </p>
        <Button onClick={() => navigate('/programmes')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux programmes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/sessions/${session.id}`)}
          className="size-9 rounded-xl border-slate-200 dark:border-white/10"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Nouvelle Cohorte
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Créez une classe d’apprentissage rattachée à la session active.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] p-6 sm:p-8 shadow-sm space-y-5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <Calendar className="size-4.5 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Session Parente (Verrouillée)
              </p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {session.nom}
              </p>
              <p className="text-xs text-slate-400">
                Période de la session : {session.date_debut} → {session.date_fin}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300">
            <Lock className="size-3 text-slate-500" />
            Fixé
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" value={session.id} {...register('session_id')} />

          <div className="space-y-1.5">
            <Label htmlFor="nom" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nom de la Cohorte <span className="text-[#FF6B0B]">*</span>
            </Label>
            <Input
              id="nom"
              placeholder="Ex: Cohorte Baol Tech 1"
              {...register('nom')}
              className={`h-11 rounded-xl bg-slate-50 dark:bg-white/5 border ${
                errors.nom ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 dark:border-white/10'
              }`}
            />
            {errors.nom && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3.5" />
                {errors.nom.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date_debut" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Date de début <span className="text-[#FF6B0B]">*</span>
              </Label>
              <Input
                id="date_debut"
                type="date"
                {...register('date_debut')}
                className={`h-11 rounded-xl bg-slate-50 dark:bg-white/5 border ${
                  errors.date_debut ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 dark:border-white/10'
                }`}
              />
              {errors.date_debut && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3.5" />
                  {errors.date_debut.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date_fin" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Date de fin <span className="text-[#FF6B0B]">*</span>
              </Label>
              <Input
                id="date_fin"
                type="date"
                {...register('date_fin')}
                className={`h-11 rounded-xl bg-slate-50 dark:bg-white/5 border ${
                  errors.date_fin ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 dark:border-white/10'
                }`}
              />
              {errors.date_fin && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3.5" />
                  {errors.date_fin.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/sessions/${session.id}`)}
              className="h-11 px-5 rounded-xl border-slate-200 dark:border-white/10 font-semibold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createCohorteMutation.isPending}
              className="h-11 px-6 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 transition-all"
            >
              {isSubmitting || createCohorteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Créer la Cohorte
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
