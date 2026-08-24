/**
 * TÂCHE 3 — Vue détail d'une cohorte.
 * Route: /cohortes/:id
 *
 * Sections:
 *   1. Header: Nom, Badge Statut, Période, Bouton Retour
 *   2. Cards Infos: Rentree parente, Membres, Projets
 *   3. Onglet Membres: tableau étudiants + rôle (GET /cohortes/:id/membres)
 *   4. Onglet Projets: tableau projets + avancement (GET /cohortes/:id/projets)
 *   5. Card État global: barre de progression % projets terminés
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  FolderOpen,
  CalendarDays,
  BookOpen,
  Mail,
  TrendingUp,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import type { Cohorte, Membre, Projet } from '@/types/cohorte';
import { getCohortById, getCohortProjects } from '@/services/cohortes/cohorteService';
import { getCohorteMembers } from '@/services/membreService';
import { CohorteStatusBadge, RoleBadge, ProjetStatusBadge, ProgressBar } from '@/components/cohortes/Badge';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatPeriode = (debut: string, fin: string): string => {
  const d = new Date(debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const f = new Date(fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${d} → ${f}`;
};

// ─── Sous-composant: Carte stat ───────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  highlight?: boolean;
}

function StatCard({ label, value, icon, sub, highlight }: StatCardProps) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${highlight
          ? 'bg-primary/5 border-primary/20 dark:bg-primary/10'
          : 'bg-card border-border'
        }`}
    >
      <div
        className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${highlight ? 'bg-primary/15' : 'bg-muted'
          }`}
      >
        <span className={highlight ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Sous-composant: Onglet Membres ──────────────────────────────────────────

interface MembersTabProps {
  cohortId: string;
}

function MembersTab({ cohortId }: MembersTabProps) {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { students, trainers } = await getCohorteMembers(cohortId);
      const mapped: Membre[] = [
        ...students.map((enrollment) => ({
          id: String(enrollment.id),
          cohorte_id: cohortId,
          nom: enrollment.user.last_name,
          prenom: enrollment.user.first_name,
          email: enrollment.user.email,
          role: enrollment.role === 'student' ? 'etudiant' : enrollment.role === 'mentor' ? 'mentor' : enrollment.role,
        })),
        ...trainers.map((trainer) => ({
          id: String(trainer.id),
          cohorte_id: cohortId,
          nom: trainer.user.last_name,
          prenom: trainer.user.first_name,
          email: trainer.user.email,
          role: 'formateur',
        })),
      ];
      setMembres(mapped);
    } catch {
      setError('Impossible de charger les membres.');
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    fetchMembres();
  }, [fetchMembres]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={fetchMembres}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="size-3.5" /> Réessayer
        </button>
      </div>
    );
  }

  if (membres.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Aucun membre dans cette cohorte</p>
        <p className="text-xs text-muted-foreground">Les membres apparaîtront ici une fois ajoutés.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <th className="text-left pb-3 px-2">#</th>
            <th className="text-left pb-3 px-2">Nom complet</th>
            <th className="text-left pb-3 px-2 hidden sm:table-cell">Email</th>
            <th className="text-left pb-3 px-2">Rôle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {membres.map((membre, index) => (
            <tr key={membre.id} className="hover:bg-muted/30 transition-colors group">
              <td className="py-3.5 px-2 text-muted-foreground text-xs">{index + 1}</td>
              <td className="py-3.5 px-2">
                <div className="flex items-center gap-3">
                  {/* Avatar généré */}
                  <div
                    className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0"
                    style={{
                      background: `hsl(${((membre.prenom || membre.nom || 'A').charCodeAt(0) * 17) % 360}, 60%, 55%)`,
                    }}
                  >
                    {(membre.prenom?.[0] || '') + (membre.nom?.[0] || 'U')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {membre.prenom ? `${membre.prenom} ${membre.nom}` : membre.nom}
                    </p>
                    <p className="text-xs text-muted-foreground sm:hidden">{membre.email}</p>
                  </div>

                </div>
              </td>
              <td className="py-3.5 px-2 hidden sm:table-cell">
                <a
                  href={`mailto:${membre.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="size-3.5" />
                  {membre.email}
                </a>
              </td>
              <td className="py-3.5 px-2">
                <RoleBadge role={membre.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-muted-foreground text-right mt-3 px-2">
        {membres.length} membre{membres.length !== 1 ? 's' : ''} au total
      </p>
    </div>
  );
}

// ─── Sous-composant: Onglet Projets ──────────────────────────────────────────

interface ProjectsTabProps {
  cohortId: string;
  onProjectsLoad?: (projets: Projet[]) => void;
}

function ProjectsTab({ cohortId, onProjectsLoad }: ProjectsTabProps) {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCohortProjects(cohortId);
      setProjets(data);
      onProjectsLoad?.(data);
    } catch {
      setError('Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  }, [cohortId, onProjectsLoad]);

  useEffect(() => {
    fetchProjets();
  }, [fetchProjets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={fetchProjets}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="size-3.5" /> Réessayer
        </button>
      </div>
    );
  }

  if (projets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <FolderOpen className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Aucun projet dans cette cohorte</p>
        <p className="text-xs text-muted-foreground">Les projets apparaîtront ici une fois créés.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projets.map((projet) => (
        <div
          key={projet.id}
          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-colors"
        >
          {/* Icône */}
          <div className="size-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
            <FolderOpen className="size-4 text-muted-foreground" />
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-foreground text-sm">{projet.nom}</h4>
              {projet.statut && <ProjetStatusBadge statut={projet.statut} />}
            </div>
            {projet.description && (
              <p className="text-xs text-muted-foreground">{projet.description}</p>
            )}
            <div className="flex items-center gap-3">
              <ProgressBar value={projet.etat_avancement ?? projet.progression ?? 0} size="sm" showLabel className="flex-1" />
            </div>

          </div>

          {/* Métadonnées */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0 text-xs text-muted-foreground">
            {projet.nb_membres && (
              <span className="flex items-center gap-1">
                <Users className="size-3" /> {projet.nb_membres} membres
              </span>
            )}
            {projet.date_fin_prevue && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {formatDate(projet.date_fin_prevue)}
              </span>
            )}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground text-right mt-1">
        {projets.length} projet{projets.length !== 1 ? 's' : ''} au total
      </p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

type TabId = 'membres' | 'projets';

export default function CohortDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Données de la cohorte
  const [cohorte, setCohorte] = useState<Cohorte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<TabId>('membres');

  // Stats projets (pour la barre de progression globale)
  const [projets, setProjets] = useState<Projet[]>([]);

  // ─── Chargement de la cohorte ─────────────────────────────────────────────

  const fetchCohorte = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCohortById(id);
      setCohorte(data);
    } catch {
      setError('Impossible de charger les détails de cette cohorte.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCohorte();
  }, [fetchCohorte]);

  // ─── Calcul progression globale ───────────────────────────────────────────

  const projetsTermines = projets.filter((p) => p.statut === 'termine').length;
  const progressionGlobale = projets.length > 0
    ? Math.round((projetsTermines / projets.length) * 100)
    : 0;

  // ─── État de chargement ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Skeleton header */}
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-20 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-6 bg-muted rounded-full w-16" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  // ─── État d'erreur ────────────────────────────────────────────────────────

  if (error || !cohorte) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Cohorte introuvable</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error || 'Cette cohorte n\'existe pas ou a été supprimée.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/cohortes')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-4" /> Retour à la liste
            </button>
            <button
              onClick={fetchCohorte}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="size-4" /> Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Rendu principal ───────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Fil d'Ariane + bouton retour */}
        <button
          id="btn-retour-liste"
          onClick={() => navigate('/cohortes')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour aux cohortes
        </button>

        {/* Titre + badge */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="size-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{cohorte.nom}</h1>
              <CohorteStatusBadge statut={cohorte.statut} className="text-sm px-3 py-1.5" />
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>{formatPeriode(cohorte.date_debut, cohorte.date_fin)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CARDS INFOS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Rentree parente"
          value={cohorte.rentree_nom || '—'}
          icon={<BookOpen className="size-5" />}
          sub="Programme associé"
        />
        <StatCard
          label="Membres"
          value={cohorte.nb_membres}
          icon={<Users className="size-5" />}
          sub="Étudiants inscrits"
          highlight
        />
        <StatCard
          label="Projets"
          value={cohorte.nb_projets}
          icon={<FolderOpen className="size-5" />}
          sub="Projets de la cohorte"
        />
      </div>

      {/* ── 5. CARD ÉTAT GLOBAL (progression) ─────────────────────────────── */}
      {projets.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              <h2 className="font-semibold text-foreground">État global de la cohorte</h2>
            </div>
            <span className="text-2xl font-bold text-primary">{progressionGlobale}%</span>
          </div>

          <ProgressBar value={progressionGlobale} size="lg" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { label: 'Terminés', count: projets.filter(p => p.statut === 'termine').length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'En cours', count: projets.filter(p => p.statut === 'en_cours').length, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'En attente', count: projets.filter(p => p.statut === 'en_attente').length, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Abandonnés', count: projets.filter(p => p.statut === 'abandonne').length, color: 'text-red-600 dark:text-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="text-center p-3 bg-muted/50 rounded-xl">
                <p className={`text-xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>
              {projetsTermines} projet{projetsTermines !== 1 ? 's' : ''} terminé{projetsTermines !== 1 ? 's' : ''} sur {projets.length}
            </span>
          </div>
        </div>
      )}

      {/* ── 3 & 4. ONGLETS MEMBRES / PROJETS ──────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Navigation des onglets */}
        <div className="flex border-b border-border">
          {[
            { id: 'membres' as TabId, label: 'Membres', icon: Users, count: cohorte.nb_membres },
            { id: 'projets' as TabId, label: 'Projets', icon: FolderOpen, count: cohorte.nb_projets },
          ].map(({ id: tabId, label, icon: Icon, count }) => (
            <button
              key={tabId}
              id={`tab-${tabId}`}
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === tabId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
            >
              <Icon className="size-4" />
              {label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tabId
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                  }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        <div className="p-5 sm:p-6">
          {activeTab === 'membres' ? (
            <MembersTab cohortId={cohorte.id} />
          ) : (
            <ProjectsTab
              cohortId={cohorte.id}
              onProjectsLoad={setProjets}
            />
          )}
        </div>
      </div>

    </div>
  );
}
