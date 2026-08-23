import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  GraduationCap,
  Users,
  Plus,
  ArrowLeft,
  Eye,
  BarChart3,
  Layers,
  CheckCircle2,
  FolderGit2,
} from 'lucide-react';
import {
  useProgramme,
  useRentreesByProgramme,
  useProgrammeDetailKPIs,
} from '../../hooks/useProgrammes';
import type { RentreeProgramme } from '../../types/programme';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { Button } from '@/components/ui/button';

export const ProgrammeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'rentrees' | 'stats'>('rentrees');

  const { data: programme, isLoading: progLoading } = useProgramme(id);
  const { data: rentrees = [], isLoading: rentLoading } = useRentreesByProgramme(id);
  const { data: kpis } = useProgrammeDetailKPIs(id);

  const columns = useMemo<ColumnDef<RentreeProgramme>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom de la Rentrée',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <CalendarDays className="size-4 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.nom}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Créée le {row.original.created_at || '—'}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'date_debut',
        header: 'Période',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {row.original.date_debut} → {row.original.date_fin}
          </span>
        ),
      },
      {
        accessorKey: 'nb_cohortes',
        header: 'Cohortes',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 font-semibold text-xs text-slate-700 dark:text-slate-300">
            <GraduationCap className="size-3.5 text-[#FF6B0B]" />
            {row.original.nb_cohortes ?? 0} cohorte(s)
          </span>
        ),
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => <StatusBadge status={row.original.statut} />,
      },
      {
        header: () => <div className="text-right pr-2">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/rentrees/${row.original.id}`)}
              className="h-8 px-3 rounded-xl border-[#FF6B0B]/30 hover:border-[#FF6B0B] hover:bg-[#FF6B0B] hover:text-white text-[#FF6B0B] font-semibold text-xs transition-colors"
            >
              <Eye className="size-3.5 mr-1.5" />
              Voir Détails
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  if (progLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-white/10 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          Programme introuvable
        </p>
        <Button onClick={() => navigate('/programmes')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux programmes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/programmes')}
              className="size-8 rounded-lg border-slate-200 dark:border-white/10"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {programme.nom}
            </h1>
            <StatusBadge status={programme.statut} />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
            {programme.description}
          </p>
          
        </div>

        <Button
          onClick={() => navigate(`/programmes/${programme.id}/rentrees/new`)}
          className="h-11 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 hover:shadow-[#FF6B0B]/40 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="size-4 mr-2" />
          Nouvelle Rentrée
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Nb Rentrées"
          value={kpis?.nb_rentrees ?? rentrees.length}
          subtitle="Promotions organisées"
          icon={CalendarDays}
        />
        <StatCard
          title="Nb Cohortes Totales"
          value={kpis?.nb_cohortes_totales ?? 0}
          subtitle="Groupes d'apprenants"
          icon={GraduationCap}
        />
        <StatCard
          title="Nb Étudiants"
          value={kpis?.nb_etudiants ?? 0}
          subtitle="Effectif cumulé"
          icon={Users}
        />
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('rentrees')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'rentrees'
            ? 'bg-[#FF6B0B]/10 text-[#FF6B0B] dark:bg-[#FF6B0B]/20'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <Layers className="size-4" />
          Rentrées ({rentrees.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'stats'
            ? 'bg-[#FF6B0B]/10 text-[#FF6B0B] dark:bg-[#FF6B0B]/20'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <BarChart3 className="size-4" />
          Statistiques
        </button>
      </div>

      {activeTab === 'rentrees' ? (
        <DataTable
          columns={columns}
          data={rentrees}
          isLoading={rentLoading}
          searchPlaceholder="Rechercher une rentrée..."
          emptyMessage="Aucune rentrée n'a encore été créée pour ce programme."
          actionsSlot={
            <Button
              size="sm"
              onClick={() => navigate(`/programmes/${programme.id}/rentrees/new`)}
              className="bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold text-xs rounded-xl"
            >
              <Plus className="size-3.5 mr-1" />
              Ajouter une rentrée
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="size-4.5 text-emerald-500" />
              Taux de Réussite & Complétion
            </h3>
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <span>Projets validés</span>
                  <span>92%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <span>Insertion professionnelle</span>
                  <span>88%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#FF6B0B] rounded-full w-[88%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="size-4.5 text-[#FF6B0B]" />
              Activité des Rentrées
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ce programme compte <strong className="text-slate-900 dark:text-white">{rentrees.length}</strong> rentrée(s) active(s) et programmée(s) pour l'année en cours.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300">
              💡 Les cohortes démarrent aux dates prévues dans chaque rentrée.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
