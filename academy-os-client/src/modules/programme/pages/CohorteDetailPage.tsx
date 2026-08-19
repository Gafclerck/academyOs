import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  FolderGit2,
  ArrowLeft,
  CalendarDays,
  Mail,
  Pencil,
  UserPlus,
  FolderOpen,
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

  /* ================= MEMBRES ================= */
  const membresColumns = useMemo<ColumnDef<Membre>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Apprenant / Membre',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-[#FF6B0B] to-[#FF8C38] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {row.original.avatar ||
                `${row.original.prenom?.[0] || ''}${row.original.nom?.[0] || ''}`}
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
            etudiant: {
              label: 'Étudiant',
              cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
            },
            mentor: {
              label: 'Mentor',
              cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            },
            lead: {
              label: 'Team Lead',
              cls: 'bg-[#FF6B0B]/10 text-[#FF6B0B] border-[#FF6B0B]/20',
            },
            admin: {
              label: 'Admin',
              cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
            },
          };

          const current = roleConfig[role] || {
            label: role,
            cls: 'bg-slate-100 text-slate-600',
          };

          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.cls}`}
            >
              {current.label}
            </span>
          );
        },
      },
    ],
    []
  );

  /* ================= PROJETS ================= */
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
          const val = row.original.progression ?? 0;
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

  /* ================= LOADING ================= */
  if (cohLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-slate-200 dark:bg-white/10 rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ================= NOT FOUND ================= */
  if (!cohorte) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          Cohorte introuvable
        </p>
        <Button onClick={() => navigate('/rentrees')} variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Retour aux rentrées
        </Button>
      </div>
    );
  }

  /* ================= PAGE ================= */
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
          Rentrées
        </button>
        <span>/</span>
        <button
          onClick={() =>
            cohorte.rentree_id
              ? navigate(`/rentrees/${cohorte.rentree_id}`)
              : navigate('/rentrees')
          }
          className="hover:text-[#FF6B0B] transition-colors"
        >
          {cohorte.rentree_nom || 'Rentrée'}
        </button>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">{cohorte.nom}</span>
      </div>

      {/* ================= HEADER ================= */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                cohorte.rentree_id
                  ? navigate(`/rentrees/${cohorte.rentree_id}`)
                  : navigate('/programmes')
              }
              className="size-8 rounded-lg"
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

        {/* ================= BOUTONS ================= */}
        <div className="flex flex-wrap items-center gap-2">
          {/* MODIFIER */}
          <Button variant="outline" className="gap-2">
            <Pencil className="size-4" />
            Modifier
          </Button>

          {/* INVITER FORMATEUR */}
          <Button
            variant="outline"
            onClick={() => navigate(`/cohortes/${id}/inviter-formateur`)}
            className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:hover:bg-blue-500/10"
          >
            <UserPlus className="size-4" />
            Inviter formateur
          </Button>

          {/* INVITER APPRENANT */}
          <Button
            variant="outline"
            onClick={() => navigate(`/cohortes/${id}/inviter-apprenant`)}
            className="gap-2 border-[#FF6B0B]/30 text-[#FF6B0B] hover:bg-[#FF6B0B]/10"
          >
            <UserPlus className="size-4" />
            Inviter apprenant
          </Button>
        </div>
      </div>

      {/* ================= KPIs ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Membres Inscrits"
          value={membres.length > 0 ? membres.length : (kpis?.nb_membres ?? cohorte.nb_membres)}
          subtitle="Apprenants de la cohorte"
          icon={Users}
        />

        <StatCard
          title="Projets Actifs"
          value={projets.length > 0 ? projets.length : (kpis?.nb_projets ?? cohorte.nb_projets)}
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Description
            </p>
            <p>{cohorte.description || 'Aucune description.'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Dates
            </p>
            <p>
              Du {cohorte.date_debut} au {cohorte.date_fin}
            </p>
          </div>
        </div>
      </div>

      {/* ================= ONGLETS ================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('membres')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
            activeTab === 'membres'
              ? 'bg-[#FF6B0B]/10 text-[#FF6B0B]'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="size-4" />
          Membres ({membres.length})
        </button>

        <button
          onClick={() => setActiveTab('projets')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
            activeTab === 'projets'
              ? 'bg-[#FF6B0B]/10 text-[#FF6B0B]'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderOpen className="size-4" />
          Projets ({projets.length})
        </button>
      </div>

      {/* ================= CONTENU ONGLET ================= */}
      {activeTab === 'membres' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] shadow-sm overflow-hidden">
          <DataTable
            columns={membresColumns}
            data={membres}
            isLoading={membLoading}
            searchPlaceholder="Rechercher un étudiant par nom ou email..."
            emptyMessage="Aucun étudiant assigné à cette cohorte pour le moment."
          />
        </div>
      )}

      {activeTab === 'projets' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] shadow-sm overflow-hidden">
          <DataTable
            columns={projetsColumns}
            data={projets}
            isLoading={projLoading}
            searchPlaceholder="Rechercher un projet..."
            emptyMessage="Aucun projet assigné à cette cohorte pour le moment."
          />
        </div>
      )}
    </div>
  );
};