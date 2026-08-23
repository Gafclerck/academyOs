import React, { useMemo } from 'react';
import { FolderGit2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { programmeService } from '../../services/programmes/programmeService';
import type { ProjetCohorte } from '../../types/programme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';

export const ProjetListPage: React.FC = () => {
  const { data: projets = [], isLoading } = useQuery({
    queryKey: ['allProjetsList'],
    queryFn: async () => {
      const p1 = await programmeService.getProjetsByCohorte('coh-1');
      return p1;
    },
  });

  const columns = useMemo<ColumnDef<ProjetCohorte>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Projet',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <FolderGit2 className="size-4 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.nom}
              </p>
              <p className="text-xs text-slate-400 line-clamp-1 max-w-sm">
                {row.original.description}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'progression',
        header: 'Avancement',
        cell: ({ row }) => (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Progression</span>
              <span className="text-slate-900 dark:text-white">{row.original.progression}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${row.original.progression === 100 ? 'bg-emerald-500' : 'bg-[#FF6B0B]'
                  }`}
                style={{ width: `${row.original.progression}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'nb_membres',
        header: 'Équipe',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Users className="size-3.5 text-[#FF6B0B]" />
            {row.original.nb_membres} membres
          </span>
        ),
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => <StatusBadge status={row.original.statut} />,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Projets des Apprenants
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Suivi des projets pratiques et livrables d’évaluation par cohorte.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={projets}
        isLoading={isLoading}
        searchPlaceholder="Rechercher un projet..."
        emptyMessage="Aucun projet trouvé."
      />
    </div>
  );
};
