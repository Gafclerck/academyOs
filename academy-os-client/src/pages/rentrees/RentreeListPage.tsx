import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  GraduationCap,
  Eye,
  BookOpen,
  Plus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { programmeService } from '../../services/programmes/programmeService';
import type { RentreeProgramme } from '../../types/programme';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { Button } from '@/components/ui/button';

export const RentreeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: rentrees = [], isLoading } = useQuery({
    queryKey: ['allRentreesList'],
    queryFn: () => programmeService.getAllRentrees(),
  });

  const { data: programmes = [] } = useQuery({
    queryKey: ['allProgrammesList'],
    queryFn: () => programmeService.getProgrammes(),
  });

  const columns = useMemo<ColumnDef<RentreeProgramme>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom de la Rentrée',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <Calendar className="size-4 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.nom}
              </p>
              <p className="text-xs text-slate-400">
                {row.original.programme_nom || 'Programme associé'}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'programme_nom',
        header: 'Programme Parent',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <BookOpen className="size-3.5 text-[#FF6B0B]" />
            {row.original.programme_nom || '—'}
          </span>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Toutes les Rentrées
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Promotions académiques et parcours planifiés par programme.
          </p>
        </div>

        <Button
          onClick={() => navigate('/rentrees/new')}
          className="h-11 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 hover:shadow-[#FF6B0B]/40 transition-all shrink-0"
        >
          <Plus className="size-4 mr-2" />
          Nouvelle Rentrée
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rentrées"
          value={rentrees.length}
          subtitle="Promotions enregistrées"
          icon={Calendar}
        />
        <StatCard
          title="Programmes"
          value={programmes.length}
          subtitle="Cursus disponibles"
          icon={BookOpen}
        />
        <StatCard
          title="Rentrées Actives"
          value={rentrees.filter((r) => r.statut === 'en_cours').length}
          subtitle="En cours"
          icon={GraduationCap}
        />
        <StatCard
          title="À venir"
          value={rentrees.filter((r) => r.statut === 'a_venir').length}
          subtitle="Planifiées"
          icon={Calendar}
        />
      </div>

      <DataTable
        columns={columns}
        data={rentrees}
        isLoading={isLoading}
        searchPlaceholder="Rechercher une rentrée ou un programme..."
        emptyMessage="Aucune rentrée enregistrée."
      />
    </div>
  );
};
