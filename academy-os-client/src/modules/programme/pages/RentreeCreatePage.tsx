import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  Lock,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import {
  createRentreeSchema,
  type CreateRentreeFormValues,
} from '../schemas/programmeSchemas';
import { useProgramme, useCreateRentree, useProgrammes } from '../hooks/useProgrammes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { StatusBadge } from '../components/ui/StatusBadge';

export const RentreeCreatePage: React.FC = () => {
  const { programmeId } = useParams<{ programmeId: string }>();
  const navigate = useNavigate();

  const { data: programmes = [] } = useProgrammes();
  const createRentreeMutation = useCreateRentree();

  const form = useForm<CreateRentreeFormValues>({
    resolver: zodResolver(createRentreeSchema),
    defaultValues: {
      programme_id: programmeId || '',
      nom: '',
      description: '',
      date_debut: '',
      date_fin: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const watchedDateDebut = useWatch({ control, name: 'date_debut' });
  const watchedDateFin = useWatch({ control, name: 'date_fin' });

  const toDate = (str: string): Date | undefined => {
    if (!str) return undefined;
    const parsed = parse(str, 'yyyy-MM-dd', new Date());
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const onSubmit = async (values: CreateRentreeFormValues) => {
    try {
      const created = await createRentreeMutation.mutateAsync({
        programme_id: values.programme_id,
        nom: values.nom,
        description: values.description,
        date_debut: values.date_debut,
        date_fin: values.date_fin,
      });
      toast.success('Rentrée créée avec succès !', {
        description: `La rentrée "${created.nom}" a été rattachée au programme.`,
      });
      navigate(`/rentrees/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création de la rentrée.';
      toast.error('Erreur', { description: msg });
    }
  };

  const handleSelectProgramme = (id: string) => {
    navigate(`/programmes/${id}/rentrees/new`);
  };

  const activeProgrammes = programmes.filter((p) => p.statut === 'actif');

  if (!programmeId) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/rentrees')}
            className="size-9 rounded-xl border-slate-200 dark:border-white/10"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Nouvelle Rentrée
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sélectionnez le programme parent, puis créez la promotion.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProgrammes.map((prog) => (
            <button
              key={prog.id}
              onClick={() => handleSelectProgramme(prog.id)}
              className="text-left p-5 rounded-2xl bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md hover:border-[#FF6B0B]/40 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
                  <BookOpen className="size-5 text-[#FF6B0B]" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{prog.nom}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{prog.duree_mois} mois</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={prog.statut} />
                <ChevronRight className="size-4 text-slate-400 group-hover:text-[#FF6B0B] transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {activeProgrammes.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
            Aucun programme actif disponible. Créez d'abord un programme.
          </div>
        )}
      </div>
    );
  }

  const { data: programme, isLoading: progLoading } = useProgramme(programmeId);

  if (progLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
        <div className="h-48 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-red-500">
          Programme parent introuvable.
        </p>
        <p className="text-xs text-slate-400">
          Une rentrée ne peut être créée sans programme parent existant.
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
          onClick={() => navigate(`/programmes/${programme.id}`)}
          className="size-9 rounded-xl border-slate-200 dark:border-white/10"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Nouvelle Rentrée
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Créez une promotion planifiée pour le cursus sélectionné.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] p-6 sm:p-8 shadow-sm space-y-5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <BookOpen className="size-4.5 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Programme Parent
              </p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {programme.nom}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300">
            <Lock className="size-3 text-slate-500" />
            Fixé
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" value={programme.id} {...register('programme_id')} />

          <div className="space-y-1.5">
            <Label htmlFor="nom" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nom de la Rentrée <span className="text-[#FF6B0B]">*</span>
            </Label>
            <Input
              id="nom"
              placeholder="Ex: Rentrée Hiver 2025"
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

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Description
            </Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Objectifs, modalités, prérequis..."
              {...register('description')}
              className={`w-full p-3.5 text-sm rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all ${
                errors.description
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-200 dark:border-white/10 focus:ring-1 focus:ring-[#FF6B0B]'
              }`}
            />
            {errors.description && (
              <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="size-3.5" />
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date_debut" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Date de début <span className="text-[#FF6B0B]">*</span>
              </Label>
              <DatePicker
                date={toDate(watchedDateDebut)}
                onDateChange={(d) => {
                  if (d) setValue('date_debut', format(d, 'yyyy-MM-dd'), { shouldValidate: true });
                }}
                placeholder="JJ/MM/AAAA"
                error={!!errors.date_debut}
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
              <DatePicker
                date={toDate(watchedDateFin)}
                onDateChange={(d) => {
                  if (d) setValue('date_fin', format(d, 'yyyy-MM-dd'), { shouldValidate: true });
                }}
                placeholder="JJ/MM/AAAA"
                error={!!errors.date_fin}
              />
              {errors.date_fin && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3.5" />
                  {errors.date_fin.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="programme_parent" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Programme Parent
            </Label>
            <Input
              id="programme_parent"
              value={programme.nom}
              disabled
              className="h-11 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11 px-5 rounded-xl border-slate-200 dark:border-white/10 font-semibold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createRentreeMutation.isPending}
              className="h-11 px-6 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 transition-all"
            >
              {isSubmitting || createRentreeMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Créer la Rentrée
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
