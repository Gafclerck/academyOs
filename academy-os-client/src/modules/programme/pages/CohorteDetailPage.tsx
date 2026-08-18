import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  FolderGit2,
  ArrowLeft,
  CalendarDays,
  Mail,
  Pencil,
} from 'lucide-react';
import {
  useCohorte,
  useCohorteDetailKPIs,
  useMembresByCohorte,
  useProjetsByCohorte,
} from '../hooks/useProgrammes';
import type { Membre, ProjetCohorte } from '../types/programme';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
import { Button } from '@/components/ui/button';

export const CohorteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: cohorte, isLoading: cohLoading } = useCohorte(id);
  const { data: kpis } = useCohorteDetailKPIs(id);
  const { data: membres = [], isLoading: membLoading } = useMembresByCohorte(id);
  const { data: projets = [], isLoading: projLoading } = useProjetsByCohorte(id);

  const membresColumns = useMemo<ColumnDef<Membre>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {row.original.prenom} {row.original.nom}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <a
            href={`mailto:${row.original.email}`}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-[#FF6B0B] transition-colors"
          >
            <Mail className="size-3.5 text-slate-400" />
            {row.original.email}
          </a>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Statut',
        cell: ({ row }) => {
          const role = row.original.role;
          const roleConfig: Record<string, { label: string; cls: string }> = {
            etudiant: { label: 'Étudiant', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
            mentor: { label: 'Mentor', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
            lead: { label: 'Team Lead', cls: 'bg-[#FF6B0B]/10 text-[#FF6B0B] border-[#FF6B0B]/20' },
            admin: { label: 'Admin', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
          };
          const current = roleConfig[role] || { label: role, cls: 'bg-slate-100 text-slate-600' };

          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.cls}`}>
              {current.label}
            </span>
          );
        },
      },
    ],
    []
  );

  const projetsColumns = useMemo<ColumnDef<ProjetCohorte>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {row.original.nom}
          </span>
        ),
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }) => <StatusBadge status={row.original.statut} />,
      },
      {
        accessorKey: 'date_fin_prevue',
        header: 'Date rendu',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {row.original.date_fin_prevue
              ? new Date(row.original.date_fin_prevue).toLocaleDateString('fr-FR')
              : '-'}
          </span>
        ),
      },
    ],
    []
  );

  if (cohLoading) {
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

  if (!cohorte) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">Cohorte introuvable</p>
        <Button onClick={() => navigate('/rentrees')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux rentrées
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <button
          onClick={() => navigate('/programmes')}
          className="hover:text-[#FF6B0B] transition-colors"
        >
          Accueil
        </button>
        <span>/</span>
        <button
          onClick={() => navigate('/rentrees')}
          className="hover:text-[#FF6B0B] transition-colors"
        >
          Rentrees
        </button>
        <span>/</span>
        <button
          onClick={() => navigate(`/rentrees/${cohorte.rentree_id}`)}
          className="hover:text-[#FF6B0B] transition-colors"
        >
          {cohorte.rentree_nom || 'Rentrée'}
        </button>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">{cohorte.nom}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                cohorte.rentree_id
                  ? navigate(`/rentrees/${cohorte.rentree_id}`)
                  : navigate('/programmes')
              }
              className="size-8 rounded-lg border-slate-200 dark:border-white/10"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {cohorte.nom}
            </h1>
            <StatusBadge status={cohorte.statut} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <CalendarDays className="size-3.5 text-[#FF6B0B]" />
              Du {cohorte.date_debut} au {cohorte.date_fin}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-10 px-5 rounded-xl border-slate-200 dark:border-white/10 font-semibold"
        >
          <Pencil className="size-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nb Étudiants"
          value={kpis?.nb_membres ?? cohorte.nb_membres}
          subtitle="Inscrits"
          icon={Users}
        />
        <StatCard
          title="Nb Projets"
          value={kpis?.nb_projets ?? cohorte.nb_projets}
          subtitle="Livrables assignés"
          icon={FolderGit2}
        />
        <StatCard
          title="Programme Parent"
          value={cohorte.programme_nom || 'Programme'}
          subtitle="Cursus d'appartenance"
          icon={CalendarDays}
        />
        <StatCard
          title="Rentrée Parente"
          value={cohorte.rentree_nom || 'Rentrée'}
          subtitle="Promotion d'appartenance"
          icon={CalendarDays}
        />
      </div>

      {/* Section Infos */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Description</p>
            <p>{cohorte.description || 'Aucune description.'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Dates</p>
            <p>Du {cohorte.date_debut} au {cohorte.date_fin}</p>
          </div>
        </div>
      </div>

      {/* Tableau Étudiants */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Étudiants</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Liste des étudiants de la cohorte</p>
        </div>
        <DataTable
          columns={membresColumns}
          data={membres}
          isLoading={membLoading}
          searchPlaceholder="Rechercher un étudiant par nom ou email..."
          emptyMessage="Aucun étudiant assigné à cette cohorte pour le moment."
        />
      </div>

      {/* Tableau Projets */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Projets</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Liste des projets de la cohorte</p>
        </div>
        <DataTable
          columns={projetsColumns}
          data={projets}
          isLoading={projLoading}
          searchPlaceholder="Rechercher un projet..."
          emptyMessage="Aucun projet assigné à cette cohorte pour le moment."
        />
      </div>
    </div>
  );
};
