import React, { useMemo } from 'react';
import { FolderGit2, AlertCircle } from 'lucide-react';
import { useProjets } from '@/hooks/useProjets';
import type { BackendProject } from '@/types/projet';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: {
    label: 'Brouillon',
    cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
  active: {
    label: 'Actif',
    cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  done: {
    label: 'Terminé',
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
};

export const ProjetListPage: React.FC = () => {
  const { data: projets = [], isLoading, error } = useProjets();

  // Afficher l'erreur via toast
  React.useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de chargement');
    }
  }, [error]);

  const columns = useMemo<ColumnDef<BackendProject>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Projet',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <FolderGit2 className="size-4 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.name}
              </p>
              <p className="text-xs text-slate-400 line-clamp-1 max-w-sm">
                {row.original.description}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'deadline',
        header: 'Deadline',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {row.original.deadline
              ? new Date(row.original.deadline).toLocaleDateString('fr-FR')
              : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'tasks',
        header: 'Tâches',
        cell: ({ row }) => {
          const tasks = row.original.tasks ?? [];
          const done = tasks.filter((t) => t.status === 'done').length;
          return (
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {done}/{tasks.length} terminées
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const cfg = statusConfig[row.original.status] ?? {
            label: row.original.status,
            cls: 'bg-slate-100 text-slate-600',
          };
          return (
            <Badge variant="outline" className={`${cfg.cls} border`}>
              {cfg.label}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Projets des Apprenants
          </h1>
        </div>
        <div className="flex items-center gap-3 p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertCircle className="size-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : 'Impossible de charger les projets.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Projets des Apprenants
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Suivi des projets pratiques et livrables d'évaluation par cohorte.
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
