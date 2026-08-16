/**
 * CohortDetailPage — /cohortes/:id
 *
 * Design aligné sur la charte graphique Auth / Xarala :
 *  - Couleur primaire : #FF6B0B (Orange Xarala)
 *  - Mode sombre : #19192D + glassmorphism
 *  - Header, Stat cards, Onglets Membres / Projets, Progression globale
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, RefreshCw,
  Users, FolderOpen, BookOpen, CalendarDays, GraduationCap,
  Mail, TrendingUp, CheckCircle2, Sparkles,
} from 'lucide-react';
import type { Cohorte, MembreCohorte, ProjetCohorte } from '@/types/cohorte';
import {
  getCohorteById,
  getMembresByCohorte,
  getProjetsByCohorte,
} from '@/services/cohorteService';
import ThemeToggle from '@/components/theme-toggle';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

// ─── Badge statut ─────────────────────────────────────────────────────────────

function StatusBadge({ statut }: { statut: Cohorte['statut'] }) {
  const cfg = statut === 'active'
    ? { dot: 'bg-emerald-500', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Active' }
    : { dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10', label: 'Terminée' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <span className={`size-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Barre de progression ─────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            v === 100
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-[#FF6B0B] to-[#ff8a38]'
          }`}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right shrink-0">{v}%</span>
    </div>
  );
}

// ─── Card stat ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, highlight = false,
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
      highlight
        ? 'bg-[#FF6B0B]/5 border-[#FF6B0B]/20 shadow-lg shadow-[#FF6B0B]/5'
        : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 shadow-sm'
    }`}>
      <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
        highlight ? 'bg-[#FF6B0B]/15 text-[#FF6B0B]' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
      }`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`text-2xl font-extrabold mt-0.5 ${highlight ? 'text-[#FF6B0B]' : 'text-slate-900 dark:text-white'}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Onglet Membres ───────────────────────────────────────────────────────────

function MembresTab({ cohortId }: { cohortId: string }) {
  const [membres, setMembres] = useState<MembreCohorte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setMembres(await getMembresByCohorte(cohortId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les membres.');
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="size-6 animate-spin text-[#FF6B0B]" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertCircle className="size-7 text-red-500" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      <button onClick={load} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold
        bg-[#FF6B0B] text-white rounded-xl shadow-md hover:bg-[#ff7a24] transition-colors">
        <RefreshCw className="size-3.5" /> Réessayer
      </button>
    </div>
  );

  if (membres.length === 0) return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <Users className="size-8 text-slate-400" />
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucun membre dans cette cohorte</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="text-left pb-3 px-3">#</th>
            <th className="text-left pb-3 px-3">Nom & Prénom</th>
            <th className="text-left pb-3 px-3 hidden sm:table-cell">Email</th>
            <th className="text-left pb-3 px-3">Rôle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {membres.map((m, i) => (
            <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
              <td className="py-4 px-3 text-xs text-slate-400">{i + 1}</td>
              <td className="py-4 px-3">
                <div className="flex items-center gap-3">
                  <div
                    className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg, hsl(${(m.nom.charCodeAt(0) * 37) % 360} 70% 50%), hsl(${((m.nom.charCodeAt(0) * 37) + 40) % 360} 80% 40%))` }}
                  >
                    {m.nom.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{m.nom}</p>
                    <p className="text-xs text-slate-400 sm:hidden">{m.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-3 hidden sm:table-cell">
                <a href={`mailto:${m.email}`}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#FF6B0B] transition-colors">
                  <Mail className="size-3.5" />{m.email}
                </a>
              </td>
              <td className="py-4 px-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                  bg-[#FF6B0B]/10 text-[#FF6B0B] border border-[#FF6B0B]/20">
                  {m.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 text-right mt-4 font-medium">
        {membres.length} membre{membres.length !== 1 ? 's' : ''} inscrits
      </p>
    </div>
  );
}

// ─── Onglet Projets ───────────────────────────────────────────────────────────

function ProjetsTab({
  cohortId,
  onLoaded,
}: {
  cohortId: string;
  onLoaded?: (projets: ProjetCohorte[]) => void;
}) {
  const [projets, setProjets] = useState<ProjetCohorte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getProjetsByCohorte(cohortId);
      setProjets(data);
      onLoaded?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  }, [cohortId, onLoaded]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="size-6 animate-spin text-[#FF6B0B]" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertCircle className="size-7 text-red-500" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      <button onClick={load} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold
        bg-[#FF6B0B] text-white rounded-xl shadow-md hover:bg-[#ff7a24] transition-colors">
        <RefreshCw className="size-3.5" /> Réessayer
      </button>
    </div>
  );

  if (projets.length === 0) return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <FolderOpen className="size-8 text-slate-400" />
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucun projet dans cette cohorte</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="text-left pb-3 px-3">#</th>
            <th className="text-left pb-3 px-3">Nom du projet</th>
            <th className="text-left pb-3 px-3 min-w-[220px]">Progression</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {projets.map((p, i) => (
            <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
              <td className="py-4 px-3 text-xs text-slate-400">{i + 1}</td>
              <td className="py-4 px-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                    <FolderOpen className="size-4 text-[#FF6B0B]" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{p.nom}</span>
                </div>
              </td>
              <td className="py-4 px-3 pr-6">
                <ProgressBar value={p.progression ?? p.etat_avancement ?? 0} />
              </td>

            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 text-right mt-4 font-medium">
        {projets.length} projet{projets.length !== 1 ? 's' : ''} au programme
      </p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

type TabId = 'membres' | 'projets';

export default function CohortDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cohorte, setCohorte] = useState<Cohorte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [activeTab, setTab]   = useState<TabId>('membres');

  const [projets, setProjets] = useState<ProjetCohorte[]>([]);

  // ─── Chargement de la cohorte ─────────────────────────────────────────────

  const loadCohorte = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      setCohorte(await getCohorteById(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger cette cohorte.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadCohorte(); }, [loadCohorte]);

  // ─── Progression globale ──────────────────────────────────────────────────

  const getProgression = (p: typeof projets[0]) => p.progression ?? p.etat_avancement ?? 0;
  const termines   = projets.filter((p) => getProgression(p) === 100).length;
  const globalPct  = projets.length > 0 ? Math.round((termines / projets.length) * 100) : 0;
  const avgPct     = projets.length > 0
    ? Math.round(projets.reduce((s, p) => s + getProgression(p), 0) / projets.length)
    : 0;


  // ─── État: chargement ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-32" />
        <div className="flex items-center gap-4">
          <div className="size-14 bg-slate-200 dark:bg-white/10 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <div className="h-7 bg-slate-200 dark:bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map((i) => <div key={i} className="h-24 bg-slate-200 dark:bg-white/10 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-white/10 rounded-3xl" />
      </div>
    );
  }

  // ─── État: erreur ─────────────────────────────────────────────────────────

  if (error || !cohorte) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
        <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cohorte introuvable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {error ?? 'Cette cohorte n\'existe pas ou a été supprimée.'}
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('/cohortes')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-slate-200 dark:border-white/10 rounded-xl
              text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="size-4" /> Retour
          </button>
          <button
            onClick={loadCohorte}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#FF6B0B] hover:bg-[#ff7a24]
              text-white rounded-xl shadow-lg shadow-[#FF6B0B]/20 transition-all"
          >
            <RefreshCw className="size-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ─── Rendu principal ──────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER
      ═══════════════════════════════════════════════════════════════════ */}

      <div className="flex items-center justify-between">
        <button
          id="btn-retour"
          onClick={() => navigate('/cohortes')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#FF6B0B]
            transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Retour aux cohortes
        </button>

        <ThemeToggle />
      </div>

      {/* Titre + badge + période */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="size-16 rounded-2xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
          <GraduationCap className="size-8 text-[#FF6B0B]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B0B] uppercase mb-1">
            <Sparkles className="size-3.5" />
            <span>Xarala Cohorte</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{cohorte.nom}</h1>
            <StatusBadge statut={cohorte.statut} />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CalendarDays className="size-4 text-[#FF6B0B]" />
            <span>{fmtDate(cohorte.date_debut)} — {fmtDate(cohorte.date_fin)}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. CARDS INFOS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Session parente"
          value={cohorte.session_nom ?? '—'}
          sub="Session associée"
          icon={<BookOpen className="size-6" />}
        />
        <StatCard
          label="Membres"
          value={cohorte.nb_membres}
          sub="Étudiants inscrits"
          icon={<Users className="size-6" />}
          highlight
        />
        <StatCard
          label="Projets"
          value={cohorte.nb_projets}
          sub="Projets pratiques"
          icon={<FolderOpen className="size-6" />}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3 & 4. ONGLETS Membres / Projets
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20 backdrop-blur-2xl">

        {/* Navigation des onglets */}
        <div className="flex border-b border-slate-200 dark:border-white/10 px-4 pt-2">
          {([
            { id: 'membres', label: 'Membres', Icon: Users,      count: cohorte.nb_membres },
            { id: 'projets', label: 'Projets', Icon: FolderOpen, count: cohorte.nb_projets },
          ] as const).map(({ id: tid, label, Icon, count }) => (
            <button
              key={tid}
              id={`tab-${tid}`}
              onClick={() => setTab(tid)}
              className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tid
                  ? 'border-[#FF6B0B] text-[#FF6B0B]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="size-4.5" />
              {label}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tid ? 'bg-[#FF6B0B]/15 text-[#FF6B0B]' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="p-6 sm:p-8">
          {activeTab === 'membres'
            ? <MembresTab cohortId={cohorte.id} />
            : <ProjetsTab cohortId={cohorte.id} onLoaded={setProjets} />
          }
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. CARTE ÉTAT GLOBAL
      ═══════════════════════════════════════════════════════════════════ */}
      {projets.length > 0 && (
        <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center">
                <TrendingUp className="size-5 text-[#FF6B0B]" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">État d'avancement global</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Moyenne de progression des projets</p>
              </div>
            </div>
            <span className="text-3xl font-extrabold text-[#FF6B0B]">{avgPct}%</span>
          </div>

          {/* Barre globale */}
          <ProgressBar value={avgPct} />

          {/* Statistiques rapides */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Terminés',     count: termines,                               color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'En cours',     count: projets.filter(p => getProgression(p) < 100 && getProgression(p) > 0).length, color: 'text-[#FF6B0B]' },
              { label: 'Non démarrés', count: projets.filter(p => getProgression(p) === 0).length, color: 'text-slate-400' },
            ].map(({ label, count, color }) => (

              <div key={label} className="text-center p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl">
                <p className={`text-2xl font-extrabold ${color}`}>{count}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>{termines} projet{termines !== 1 ? 's' : ''} complété{termines !== 1 ? 's' : ''} sur {projets.length} ({globalPct}%)</span>
          </div>
        </div>
      )}

    </div>
  );
}
