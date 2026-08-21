import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  ArrowLeft,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { useRentree, useCohortesByRentree, useRentreeDetailKPIs } from '../../hooks/useProgrammes';
import type { CohorteRentree } from '../../types/programme';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { Button } from '@/components/ui/button';

export const RentreeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: rentree, isLoading: rentreeLoading } = useRentree(id);
  const { data: cohortes = [], isLoading: cohortesLoading } = useCohortesByRentree(id);
  const { data: kpis } = useRentreeDetailKPIs(id);

  const totalEtudiants = useMemo(
    () => cohortes.reduce((acc, c) => acc + (c.nb_membres || 0), 0),
    [cohortes]
  );

  const columns = useMemo<ColumnDef<CohorteRentree>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom de la Cohorte',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <GraduationCap className="size-4 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.nom}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {row.original.rentree_nom || rentree?.nom}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'date_debut',
        header: 'Date de début',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {new Date(row.original.date_debut).toLocaleDateString('fr-FR')}
          </span>
        ),
      },
      {
        accessorKey: 'date_fin',
        header: 'Date de fin',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {new Date(row.original.date_fin).toLocaleDateString('fr-FR')}
          </span>
        ),
      },
      {
        accessorKey: 'nb_membres',
        header: 'Nb Étudiants',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {row.original.nb_membres}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => <StatusBadge status={row.original.statut} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/cohortes/${row.original.id}`)}
            className="h-8 px-3 rounded-lg border-slate-200 dark:border-white/10 font-semibold text-xs"
          >
            <Eye className="size-3.5 mr-1.5" />
            Voir
          </Button>
        ),
      },
    ],
    [navigate, rentree?.nom]
  );

  if (rentreeLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-slate-200 dark:bg-white/10 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-white/10 rounded-2xl" />
        </div>
        <div className="h-96 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!rentree) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-red-500">Rentrée introuvable.</p>
        <Button onClick={() => navigate('/rentrees')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux rentrées
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {rentree.nom}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {new Date(rentree.date_debut).toLocaleDateString('fr-FR')} - {new Date(rentree.date_fin).toLocaleDateString('fr-FR')}
              {rentree.programme_nom && (
                <span className="ml-2 text-[#FF6B0B]">• {rentree.programme_nom}</span>
              )}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate(`/rentrees/${rentree.id}/cohortes/new`)}
          className="h-10 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 transition-all"
        >
          <Plus className="size-4 mr-2" />
          Nouvelle Cohorte
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cohortes"
          value={kpis?.nb_cohortes ?? cohortes.length}
          subtitle="Groupes actifs"
          icon={GraduationCap}
        />
        <StatCard
          title="Nb Étudiants"
          value={kpis?.nb_membres ?? totalEtudiants}
          subtitle="Inscrits"
          icon={Users}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Liste des Cohortes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toutes les cohortes rattachées à cette rentrée
          </p>
        </div>
        <DataTable
          columns={columns}
          data={cohortes}
          searchPlaceholder="Rechercher une cohorte..."
          emptyMessage="Aucune cohorte pour cette rentrée"
          isLoading={cohortesLoading}
        />
        {!cohortesLoading && cohortes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <GraduationCap className="size-8 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Aucune cohorte créée
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
              Créez votre première cohorte pour commencer à gérer les apprenants de cette rentrée.
            </p>
            <Button
              onClick={() => navigate(`/rentrees/${rentree.id}/cohortes/new`)}
              className="h-10 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 transition-all"
            >
              <Plus className="size-4 mr-2" />
              Créer la première cohorte
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
