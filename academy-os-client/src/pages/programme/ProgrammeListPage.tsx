import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  Calendar,
  Users,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { useProgrammes, useProgrammeKPIs } from '../../hooks/useProgrammes';
import type { Programme } from '../../types/programme';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { Button } from '@/components/ui/button';

export const ProgrammeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: programmes = [], isLoading } = useProgrammes();
  const { data: kpis } = useProgrammeKPIs();

  const [statutFilter, setStatutFilter] = useState<'all' | 'actif' | 'inactif'>('all');

  const filteredData = useMemo(() => {
    if (statutFilter === 'all') return programmes;
    return programmes.filter((p) => p.statut === statutFilter);
  }, [programmes, statutFilter]);

  const columns = useMemo<ColumnDef<Programme>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom du Programme',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <BookOpen className="size-4.5 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.nom}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Durée : {row.original.duree_mois} mois
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-md">
            {row.original.description}
          </p>
        ),
      },
      {
        accessorKey: 'nb_rentrees',
        header: 'Sessions',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 font-semibold text-xs text-slate-700 dark:text-slate-300">
            <Calendar className="size-3.5 text-[#FF6B0B]" />
            {row.original.nb_rentrees ?? 0} rentree(s)
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
              onClick={() => navigate(`/programmes/${row.original.id}`)}
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
            Programmes Académiques
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gérez et supervisez l'ensemble des parcours et offres de formation.
          </p>
        </div>

        <Button
          onClick={() => navigate('/programmes/new')}
          className="h-11 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 hover:shadow-[#FF6B0B]/40 transition-all cursor-pointer"
        >
          <Plus className="size-4 mr-2" />
          Nouveau Programme
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Programmes"
          value={kpis?.total_programmes ?? programmes.length}
          subtitle="Formations enregistrées"
          icon={BookOpen}
        />
        <StatCard
          title="Programmes Actifs"
          value={kpis?.programmes_actifs ?? programmes.filter((p) => p.statut === 'actif').length}
          subtitle="Actuellement ouverts"
          icon={CheckCircle2}
          trend="Actifs"
        />
        <StatCard
          title="Total Rentrées"
          value={kpis?.total_rentrees ?? 0}
          subtitle="Promotions organisées"
          icon={Calendar}
        />
        <StatCard
          title="Total Étudiants"
          value={kpis?.total_etudiants ?? 0}
          subtitle="Apprenants inscrits"
          icon={Users}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Rechercher un programme par mot-clé..."
        emptyMessage="Aucun programme trouvé. Commencez par créer un nouveau programme."
        filtersSlot={
          <div className="relative min-w-[170px]">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value as 'all' | 'actif' | 'inactif')}
              className="w-full h-10 pl-3.5 pr-9 text-xs font-semibold bg-white dark:bg-[#1f1f38] border border-slate-200 dark:border-white/10 rounded-xl outline-none appearance-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#FF6B0B] cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs uniquement</option>
              <option value="inactif">Inactifs uniquement</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          </div>
        }
      />
    </div>
  );
};
