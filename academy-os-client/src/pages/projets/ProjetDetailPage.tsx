import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProjetById } from '@/services/projets/projetService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ProjetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: projet, isLoading } = useQuery({
    queryKey: ['projet', id],
    queryFn: () => getProjetById(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
        <div className="h-48 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">Projet introuvable</p>
        <Button onClick={() => navigate('/projets')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux projets
        </Button>
      </div>
    );
  }

  const statutConfig: Record<string, { label: string; cls: string }> = {
    en_cours: { label: 'En cours', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    termine: { label: 'Terminé', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    en_attente: { label: 'En attente', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  };
  const currentStatut = statutConfig[projet.statut] || { label: projet.statut, cls: 'bg-slate-100 text-slate-600' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/projets')}
          className="size-9 rounded-xl border-slate-200 dark:border-white/10"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {projet.nom}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cohorte #{projet.cohorte_id}
          </p>
        </div>
        <Button variant="outline" className="h-10 px-5 rounded-xl border-slate-200 dark:border-white/10 font-semibold">
          <Pencil className="size-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Statut</p>
          <Badge variant="outline" className={`${currentStatut.cls} border`}>
            {currentStatut.label}
          </Badge>
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avancement</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{projet.progression}%</p>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${projet.progression === 100 ? 'bg-emerald-500' : 'bg-[#FF6B0B]'}`}
              style={{ width: `${projet.progression}%` }}
            />
          </div>
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Équipe</p>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[#FF6B0B]" />
            <span className="text-lg font-bold text-slate-900 dark:text-white">{projet.nb_membres} membres</span>
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Description</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{projet.description}</p>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#FF6B0B]" />
            <span>Début : {projet.date_debut ? new Date(projet.date_debut).toLocaleDateString('fr-FR') : '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#FF6B0B]" />
            <span>Rendu prévu : {projet.date_fin_prevue ? new Date(projet.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
