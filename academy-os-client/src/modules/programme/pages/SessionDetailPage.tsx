import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  FolderOpen,
  Plus,
  ArrowLeft,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  Mail,
  UserCheck,
} from 'lucide-react';
import {
  useSession,
  useCohortesBySession,
  useSessionDetailKPIs,
} from '../hooks/useProgrammes';
import type { CohorteSession } from '../types/programme';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
import { Button } from '@/components/ui/button';

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'cohortes' | 'membres' | 'planning'>('cohortes');

  const { data: session, isLoading: sessLoading } = useSession(id);
  const { data: cohortes = [], isLoading: cohLoading } = useCohortesBySession(id);
  const { data: kpis } = useSessionDetailKPIs(id);

  const columns = useMemo<ColumnDef<CohorteSession>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom de la Cohorte',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
              <GraduationCap className="size-4.5 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {row.original.nom}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {row.original.programme_nom || 'Programme associé'}
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
        accessorKey: 'nb_membres',
        header: 'Membres',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 font-semibold text-xs text-slate-700 dark:text-slate-300">
            <Users className="size-3.5 text-[#FF6B0B]" />
            {row.original.nb_membres ?? 0} apprenant(s)
          </span>
        ),
      },
      {
        accessorKey: 'nb_projets',
        header: 'Projets',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 font-semibold text-xs text-slate-700 dark:text-slate-300">
            <FolderOpen className="size-3.5 text-[#FF6B0B]" />
            {row.original.nb_projets ?? 0} projet(s)
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
              onClick={() => navigate(`/cohortes/${row.original.id}`)}
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

  if (sessLoading) {
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

  if (!session) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          Session introuvable
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
                session.programme_id
                  ? navigate(`/programmes/${session.programme_id}`)
                  : navigate('/programmes')
              }
              className="size-8 rounded-lg border-slate-200 dark:border-white/10"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {session.nom}
            </h1>
            <StatusBadge status={session.statut} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {session.programme_nom && (
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <BookOpen className="size-3.5 text-[#FF6B0B]" />
                Programme : <strong>{session.programme_nom}</strong>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#FF6B0B]" />
              Du {session.date_debut} au {session.date_fin}
            </span>
          </div>
        </div>

        <Button
          onClick={() => navigate(`/sessions/${session.id}/cohortes/new`)}
          className="h-11 px-5 rounded-xl bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold shadow-lg shadow-[#FF6B0B]/25 hover:shadow-[#FF6B0B]/40 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="size-4 mr-2" />
          Nouvelle Cohorte
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Nb Cohortes"
          value={kpis?.nb_cohortes ?? cohortes.length}
          subtitle="Classes formées"
          icon={GraduationCap}
        />
        <StatCard
          title="Nb Membres"
          value={kpis?.nb_membres ?? 0}
          subtitle="Apprenants inscrits"
          icon={Users}
        />
        <StatCard
          title="Nb Projets"
          value={kpis?.nb_projets ?? 0}
          subtitle="Livrables assignés"
          icon={FolderOpen}
        />
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('cohortes')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'cohortes'
              ? 'bg-[#FF6B0B]/10 text-[#FF6B0B] dark:bg-[#FF6B0B]/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="size-4" />
          Cohortes ({cohortes.length})
        </button>
        <button
          onClick={() => setActiveTab('membres')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'membres'
              ? 'bg-[#FF6B0B]/10 text-[#FF6B0B] dark:bg-[#FF6B0B]/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="size-4" />
          Membres ({kpis?.nb_membres ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('planning')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'planning'
              ? 'bg-[#FF6B0B]/10 text-[#FF6B0B] dark:bg-[#FF6B0B]/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="size-4" />
          Planning
        </button>
      </div>

      {activeTab === 'cohortes' && (
        <DataTable
          columns={columns}
          data={cohortes}
          isLoading={cohLoading}
          searchPlaceholder="Rechercher une cohorte..."
          emptyMessage="Aucune cohorte rattachée à cette session. Cliquez sur 'Nouvelle Cohorte' pour commencer."
          actionsSlot={
            <Button
              size="sm"
              onClick={() => navigate(`/sessions/${session.id}/cohortes/new`)}
              className="bg-[#FF6B0B] hover:bg-[#ff7a24] text-white font-semibold text-xs rounded-xl"
            >
              <Plus className="size-3.5 mr-1" />
              Ajouter une cohorte
            </Button>
          }
        />
      )}

      {activeTab === 'membres' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="size-4.5 text-[#FF6B0B]" />
              Effectif Général de la Session
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {kpis?.nb_membres ?? 0} apprenants au total
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {[
              { nom: 'Diop', prenom: 'Moussa', email: 'moussa.diop@xarala.co', role: 'Étudiant', cohorte: 'Cohorte Baol Tech 1' },
              { nom: 'Sow', prenom: 'Awa', email: 'awa.sow@xarala.co', role: 'Team Lead', cohorte: 'Cohorte Baol Tech 1' },
              { nom: 'Fall', prenom: 'Cheikh', email: 'cheikh.fall@xarala.co', role: 'Étudiant', cohorte: 'Cohorte Baol Tech 1' },
              { nom: 'Ndiaye', prenom: 'Fatou', email: 'fatou.ndiaye@xarala.co', role: 'Mentor', cohorte: 'Cohorte Dakar Alpha' },
            ].map((m, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#FF6B0B]/10 text-[#FF6B0B] font-bold text-xs flex items-center justify-center">
                    {m.prenom[0]}{m.nom[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-white">
                      {m.prenom} {m.nom}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Mail className="size-3" />
                      {m.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                    {m.role}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.cohorte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 space-y-6 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="size-4.5 text-[#FF6B0B]" />
            Chronologie de la Session
          </h3>

          <div className="space-y-6 border-l-2 border-[#FF6B0B]/30 pl-4 ml-2">
            <div className="relative">
              <div className="absolute -left-[23px] top-1 size-3 rounded-full bg-[#FF6B0B]" />
              <p className="text-xs font-bold text-[#FF6B0B]">Démarrage officiel</p>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">{session.date_debut}</p>
              <p className="text-xs text-slate-500">Lancement des cours, onboarding des étudiants et répartition en cohortes.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[23px] top-1 size-3 rounded-full bg-blue-500" />
              <p className="text-xs font-bold text-blue-500">Hackathon & Projets Pratiques</p>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">Mi-parcours</p>
              <p className="text-xs text-slate-500">Mise en application réelle des acquis techniques en équipes de projet.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[23px] top-1 size-3 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold text-emerald-500">Clôture & Jury de Soutenance</p>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">{session.date_fin}</p>
              <p className="text-xs text-slate-500">Évaluation finale, délivrance des certificats et transition vers l'insertion.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
