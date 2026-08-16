import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  FolderOpen,
  ArrowLeft,
  Calendar,
  Mail,
  BookOpen,
  FolderGit2,
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

  const [activeTab, setActiveTab] = useState<'membres' | 'projets'>('membres');

  const { data: cohorte, isLoading: cohLoading } = useCohorte(id);
  const { data: kpis } = useCohorteDetailKPIs(id);
  const { data: membres = [], isLoading: membLoading } = useMembresByCohorte(id);
  const { data: projets = [], isLoading: projLoading } = useProjetsByCohorte(id);

  const membresColumns = useMemo<ColumnDef<Membre>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Apprenant / Membre',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-[#FF6B0B] to-[#FF8C38] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {row.original.avatar || `${row.original.prenom[0]}${row.original.nom[0]}`}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.prenom} {row.original.nom}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Inscrit le {row.original.date_rejoint || '2026-01-15'}
              </p>
            </div>
          </div>
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
        header: 'Rôle',
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
        header: 'Nom du Projet',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
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
        cell: ({ row }) => {
          const val = row.original.progression;
          return (
            <div className="w-36 space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Progression</span>
                <span className="text-slate-900 dark:text-white">{val}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    val === 100 ? 'bg-emerald-500' : 'bg-[#FF6B0B]'
                  }`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        },
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
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          Cohorte introuvable
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
              onClick={() =>
                cohorte.session_id
                  ? navigate(`/sessions/${cohorte.session_id}`)
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
            {cohorte.session_nom && (
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <BookOpen className="size-3.5 text-[#FF6B0B]" />
                Session parente : <strong>{cohorte.session_nom}</strong>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#FF6B0B]" />
              Du {cohorte.date_debut} au {cohorte.date_fin}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Session Parente"
          value={kpis?.session_nom || cohorte.session_nom || 'Session'}
          subtitle="Promotion d'appartenance"
          icon={BookOpen}
        />
        <StatCard
          title="Membres Inscrits"
          value={membres.length > 0 ? membres.length : cohorte.nb_membres}
          subtitle="Apprenants de la cohorte"
          icon={Users}
        />
        <StatCard
          title="Projets Actifs"
          value={projets.length > 0 ? projets.length : cohorte.nb_projets}
          subtitle="Livrables assignés"
          icon={FolderOpen}
        />
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('membres')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'membres'
              ? 'bg-[#FF6B0B]/10 text-[#FF6B0B] dark:bg-[#FF6B0B]/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="size-4" />
          Membres ({membres.length})
        </button>
        <button
          onClick={() => setActiveTab('projets')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'projets'
              ? 'bg-[#FF6B0B]/10 text-[#FF6B0B] dark:bg-[#FF6B0B]/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderOpen className="size-4" />
          Projets ({projets.length})
        </button>
      </div>

      {activeTab === 'membres' && (
        <DataTable
          columns={membresColumns}
          data={membres}
          isLoading={membLoading}
          searchPlaceholder="Rechercher un membre par nom ou email..."
          emptyMessage="Aucun membre assigné à cette cohorte pour le moment."
        />
      )}

      {activeTab === 'projets' && (
        <DataTable
          columns={projetsColumns}
          data={projets}
          isLoading={projLoading}
          searchPlaceholder="Rechercher un projet..."
          emptyMessage="Aucun projet assigné à cette cohorte pour le moment."
        />
      )}
    </div>
  );
};
