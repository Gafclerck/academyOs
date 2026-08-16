/**
 * CohortListPage — /cohortes
 *
 * Design aligné sur la charte graphique Auth / Xarala :
 *  - Couleur primaire : #FF6B0B (Orange Xarala)
 *  - Mode sombre : #19192D + cartes glassmorphism
 *  - Filtres, stats, boutons avec hover/focus Xarala
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Search, RefreshCw,
  AlertCircle, GraduationCap, Users, FolderOpen,
  ChevronDown, Loader2, Sparkles,
} from 'lucide-react';
import type { Cohorte, Session, CohorteFilters } from '@/types/cohorte';
import { getCohortes, getSessions } from '@/services/cohorteService';
import CreateCohortModal from '@/components/cohorte/CreateCohortModal';
import ThemeToggle from '@/components/theme-toggle';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Badge Statut ─────────────────────────────────────────────────────────────

function StatusBadge({ statut }: { statut: Cohorte['statut'] }) {
  const cfg = statut === 'active'
    ? { dot: 'bg-emerald-500', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Active' }
    : { dot: 'bg-slate-400',   cls: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10', label: 'Terminée' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <span className={`size-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr_2fr_2fr_80px_80px_100px_130px] gap-4 px-6 py-4 border-b border-slate-200 dark:border-white/5 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-4/5" />
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded mx-auto w-8" />
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded mx-auto w-8" />
      <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-full w-20" />
      <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-xl w-24" />
    </div>
  );
}

// ─── Carte mobile ─────────────────────────────────────────────────────────────

function MobileCard({
  cohorte,
  onView,
}: {
  cohorte: Cohorte;
  onView: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
            <GraduationCap className="size-5 text-[#FF6B0B]" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-base">{cohorte.nom}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cohorte.session_nom ?? '—'}</p>
          </div>
        </div>
        <StatusBadge statut={cohorte.statut} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-2.5">
          <p className="text-slate-500 dark:text-slate-400">Période</p>
          <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">{fmtDate(cohorte.date_debut)}</p>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-2.5">
          <p className="text-slate-500 dark:text-slate-400">Membres</p>
          <p className="font-bold text-[#FF6B0B] text-sm mt-0.5">{cohorte.nb_membres}</p>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-2.5">
          <p className="text-slate-500 dark:text-slate-400">Projets</p>
          <p className="font-bold text-[#FF6B0B] text-sm mt-0.5">{cohorte.nb_projets}</p>
        </div>
      </div>

      <button
        id={`view-${cohorte.id}`}
        onClick={() => onView(cohorte.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold
          bg-[#FF6B0B]/10 hover:bg-[#FF6B0B] text-[#FF6B0B] hover:text-white rounded-xl transition-all duration-200"
      >
        <Eye className="size-4" /> Voir Détails
      </button>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function CohortListPage() {
  const navigate = useNavigate();

  const [cohortes, setCohortes]       = useState<Cohorte[]>([]);
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [modalOpen, setModalOpen]     = useState(false);

  const [filters, setFilters] = useState<CohorteFilters>({
    statut: 'active',
    session_id: '',
    search: '',
  });

  // ─── Chargement ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, sess] = await Promise.all([getCohortes(filters), getSessions()]);
      setCohortes(data);
      setSessions(sess);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les cohortes.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const setFilter = <K extends keyof CohorteFilters>(key: K, val: CohorteFilters[K]) =>
    setFilters((p) => ({ ...p, [key]: val }));

  const handleView = (id: string) => navigate(`/cohortes/${id}`);

  // ─── États d'erreur ───────────────────────────────────────────────────────

  if (error && !loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
        <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Erreur de chargement</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#FF6B0B] hover:bg-[#ff7a24] text-white rounded-xl shadow-lg shadow-[#FF6B0B]/20 transition-all"
        >
          <RefreshCw className="size-4" /> Réessayer
        </button>
      </div>
    );
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#FF6B0B] uppercase mb-1.5">
            <Sparkles className="size-3.5" />
            <span>Xarala Academy OS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center">
              <GraduationCap className="size-6 text-[#FF6B0B]" />
            </div>
            Gestion des Cohortes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {loading ? 'Chargement en cours…' : `${cohortes.length} cohorte${cohortes.length !== 1 ? 's' : ''} répertoriée${cohortes.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            id="btn-nouvelle-cohorte"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#FF6B0B] hover:bg-[#ff7a24] rounded-2xl
              hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#FF6B0B]/25 shrink-0"
          >
            <Plus className="size-4.5" />
            Nouvelle Cohorte
          </button>
        </div>
      </div>

      {/* ── Filtres ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
          <input
            id="filter-search"
            type="text"
            placeholder="Rechercher une cohorte…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:border-[#FF6B0B]/60 focus:ring-4 focus:ring-[#FF6B0B]/10 transition-all"
          />
        </div>

        {/* Filtre session */}
        <div className="relative">
          <select
            id="filter-session"
            value={filters.session_id}
            onChange={(e) => setFilter('session_id', e.target.value)}
            className="w-full h-11 pl-4 pr-10 text-sm bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl outline-none appearance-none text-slate-900 dark:text-white
              focus:border-[#FF6B0B]/60 focus:ring-4 focus:ring-[#FF6B0B]/10 transition-all cursor-pointer"
          >
            <option value="" className="dark:bg-[#19192D]">Toutes les sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id} className="dark:bg-[#19192D]">{s.nom}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>

        {/* Filtre statut */}
        <div className="relative">
          <select
            id="filter-statut"
            value={filters.statut}
            onChange={(e) => setFilter('statut', e.target.value as CohorteFilters['statut'])}
            className="w-full h-11 pl-4 pr-10 text-sm bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl outline-none appearance-none text-slate-900 dark:text-white
              focus:border-[#FF6B0B]/60 focus:ring-4 focus:ring-[#FF6B0B]/10 transition-all cursor-pointer"
          >
            <option value="toutes" className="dark:bg-[#19192D]">Tous les statuts</option>
            <option value="active" className="dark:bg-[#19192D]">Actives</option>
            <option value="terminee" className="dark:bg-[#19192D]">Terminées</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Tableau desktop ───────────────────────────────────────────────── */}
      <div className="hidden sm:block bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20 backdrop-blur-2xl">

        {/* Entête colonnes */}
        <div className="grid grid-cols-[2fr_2fr_2fr_80px_80px_100px_130px] gap-4 px-6 py-4
          bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10
          text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Nom de la cohorte</span>
          <span>Session parente</span>
          <span>Période</span>
          <span className="text-center">Membres</span>
          <span className="text-center">Projets</span>
          <span>Statut</span>
          <span className="text-right pr-2">Action</span>
        </div>

        {/* Corps */}
        {loading ? (
          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
        ) : cohortes.length === 0 ? (
          // ── État vide ────────────────────────────────────────────────────
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="size-16 rounded-2xl bg-[#FF6B0B]/10 flex items-center justify-center">
              <GraduationCap className="size-8 text-[#FF6B0B]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-lg">Aucune cohorte trouvée</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ajustez vos filtres ou créez une nouvelle cohorte.</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                bg-[#FF6B0B] hover:bg-[#ff7a24] text-white rounded-xl shadow-lg shadow-[#FF6B0B]/20 transition-all"
            >
              <Plus className="size-4" /> Créer une cohorte
            </button>
          </div>
        ) : (
          // ── Lignes ───────────────────────────────────────────────────────
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {cohortes.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[2fr_2fr_2fr_80px_80px_100px_130px] gap-4 px-6 py-4.5
                  items-center hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Nom */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl bg-[#FF6B0B]/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="size-4.5 text-[#FF6B0B]" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{c.nom}</span>
                </div>

                {/* Session */}
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{c.session_nom ?? '—'}</span>

                {/* Période */}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {fmtDate(c.date_debut)} → {fmtDate(c.date_fin)}
                </span>

                {/* Membres */}
                <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Users className="size-4 text-[#FF6B0B]" />{c.nb_membres}
                </div>

                {/* Projets */}
                <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <FolderOpen className="size-4 text-[#FF6B0B]" />{c.nb_projets}
                </div>

                {/* Statut */}
                <StatusBadge statut={c.statut} />

                {/* Actions */}
                <div className="flex items-center justify-end">
                  <button
                    id={`view-cohort-${c.id}`}
                    onClick={() => handleView(c.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold
                      bg-[#FF6B0B]/10 hover:bg-[#FF6B0B] text-[#FF6B0B] hover:text-white rounded-xl transition-all duration-200"
                  >
                    <Eye className="size-3.5" /> Voir Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cartes mobile ─────────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
              <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[0,1,2].map((j) => <div key={j} className="h-12 bg-slate-200 dark:bg-white/10 rounded-xl" />)}
              </div>
            </div>
          ))
        ) : cohortes.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-12">
            Aucune cohorte trouvée.
          </p>
        ) : (
          cohortes.map((c) => (
            <MobileCard key={c.id} cohorte={c} onView={handleView} />
          ))
        )}
      </div>

      {/* ── Loading overlay spinner (re-filtre) ──────────────────────────── */}
      {loading && cohortes.length > 0 && (
        <div className="flex justify-center pt-2">
          <Loader2 className="size-5 animate-spin text-[#FF6B0B]" />
        </div>
      )}

      {/* ── Modal création ────────────────────────────────────────────────── */}
      <CreateCohortModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
