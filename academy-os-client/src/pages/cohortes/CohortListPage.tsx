
/**
 * TÂCHE 2 — Vue liste des cohortes actives.
 * Route: /cohortes
 *
 * Fonctionnalités:
 *   - Tableau avec colonnes [Nom, Session, Période, Membres, Projets, Statut, Actions]
 *   - Filtres par Session et par Statut
 *   - Bouton "+ Nouvelle Cohorte" → ouvre CreateCohortModal
 *   - États: Loading, Empty, Error
 *   - Responsive mobile
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  AlertCircle,
  Users,
  FolderOpen,
  Eye,
  Pencil,
  RefreshCw,
  Search,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';

import type { Cohorte, Session, CohorteFilters } from '@/types/cohorte';
import { getCohortes, getSessions } from '@/services/cohorteService';
import { CohorteStatusBadge } from '@/components/cohortes/Badge';
import CreateCohortModal from '@/components/cohortes/CreateCohortModal';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/** Formate une date ISO en format lisible français */
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─── Sous-composant: Skeleton loading ─────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 px-6 py-4 border-b border-border last:border-0">
          <div className="h-4 bg-muted rounded flex-1" />
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-28" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-6 bg-muted rounded-full w-20" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Sous-composant: Ligne mobile (carte) ─────────────────────────────────────

interface CohortCardProps {
  cohorte: Cohorte;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

function CohortCard({ cohorte, onView, onEdit }: CohortCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{cohorte.nom}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{cohorte.session_nom}</p>
        </div>
        <CohorteStatusBadge statut={cohorte.statut} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-muted rounded-lg p-2">
          <p className="text-muted-foreground">Début</p>
          <p className="font-medium text-foreground">{formatDate(cohorte.date_debut)}</p>
        </div>
        <div className="bg-muted rounded-lg p-2">
          <p className="text-muted-foreground">Membres</p>
          <p className="font-semibold text-foreground">{cohorte.nb_membres}</p>
        </div>
        <div className="bg-muted rounded-lg p-2">
          <p className="text-muted-foreground">Projets</p>
          <p className="font-semibold text-foreground">{cohorte.nb_projets}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1 border-t border-border">
        <button
          onClick={() => onView(cohorte.id)}
          id={`view-cohort-${cohorte.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium
            bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Eye className="size-3.5" /> Voir Détails
        </button>
        <button
          onClick={() => onEdit(cohorte.id)}
          id={`edit-cohort-${cohorte.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium
            border border-border text-muted-foreground rounded-lg hover:text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="size-3.5" /> Modifier
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CohortListPage() {
  const navigate = useNavigate();

  // Données
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState<CohorteFilters>({
    statut: 'active',
    session_id: '',
    search: '',
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Chargement des données ─────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cohortesData, sessionsData] = await Promise.all([
        getCohortes(filters),
        getSessions(),
      ]);
      setCohortes(cohortesData);
      setSessions(sessionsData);
    } catch {
      setError('Impossible de charger les cohortes. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleFilterChange = (key: keyof CohorteFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };


  const handleView = (id: string) => navigate(`/cohortes/${id}`);
  const handleEdit = (id: string) => {
    // TODO: ouvrir un modal d'édition (même composant que création, pré-rempli)
    console.log('Modifier cohorte:', id);
  };

  const handleModalSuccess = () => {
    fetchData(); // Rafraîchir la liste après création
  };

  // ─── Rendu: État d'erreur ──────────────────────────────────────────────────

  if (error && !loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Erreur de chargement</h2>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="size-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ─── Rendu principal ───────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Programmes</span>
            <span>/</span>
            <span>Sessions</span>
            <span>/</span>
            <span className="text-foreground font-medium">Cohortes</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="size-6 text-primary" />
            Gestion des Cohortes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${cohortes.length} cohorte${cohortes.length !== 1 ? 's' : ''} trouvée${cohortes.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <button
          id="btn-nouvelle-cohorte"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-xl
            hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/20 shrink-0"
        >
          <Plus className="size-4" />
          Nouvelle Cohorte
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="filter-search"
            type="text"
            placeholder="Rechercher une cohorte…"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-sm bg-background border border-input rounded-lg outline-none
              focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Filtre par Session */}
        <div className="relative">
          <select
            id="filter-session"
            value={filters.session_id}
            onChange={(e) => handleFilterChange('session_id', e.target.value)}
            className="h-10 pl-3 pr-9 text-sm bg-background border border-input rounded-lg outline-none appearance-none
              focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[180px]"
          >
            <option value="">Toutes les sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.nom}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Filtre par Statut */}
        <div className="relative">
          <select
            id="filter-statut"
            value={filters.statut}
            onChange={(e) => handleFilterChange('statut', e.target.value as CohorteFilters['statut'])}
            className="h-10 pl-3 pr-9 text-sm bg-background border border-input rounded-lg outline-none appearance-none
              focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[150px]"
          >
            <option value="toutes">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="terminee">Terminées</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* ── Tableau desktop ──────────────────────────────────────────────────── */}
      <div className="hidden sm:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

        {/* Entête du tableau */}
        <div className="grid grid-cols-[2fr_2fr_2fr_80px_80px_110px_150px] gap-4 px-6 py-3.5 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Nom</span>
          <span>Session parente</span>
          <span>Période</span>
          <span className="text-center">Membres</span>
          <span className="text-center">Projets</span>
          <span>Statut</span>
          <span>Actions</span>
        </div>

        {/* Corps du tableau */}
        {loading ? (
          <TableSkeleton />
        ) : cohortes.length === 0 ? (
          // État vide
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
              <GraduationCap className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Aucune cohorte trouvée</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ajustez vos filtres ou créez une nouvelle cohorte.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-4" /> Créer une cohorte
            </button>
          </div>
        ) : (
          // Lignes du tableau
          <div className="divide-y divide-border">
            {cohortes.map((cohorte) => (
              <div
                key={cohorte.id}
                className="grid grid-cols-[2fr_2fr_2fr_80px_80px_110px_150px] gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors group"
              >
                {/* Nom */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="size-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground text-sm truncate">{cohorte.nom}</span>
                </div>

                {/* Session parente */}
                <span className="text-sm text-muted-foreground truncate">{cohorte.session_nom}</span>

                {/* Période */}
                <div className="text-sm text-muted-foreground">
                  <span>{formatDate(cohorte.date_debut)}</span>
                  <span className="mx-1 text-border">→</span>
                  <span>{formatDate(cohorte.date_fin)}</span>
                </div>

                {/* Membres */}
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Users className="size-3.5 text-muted-foreground" />
                  {cohorte.nb_membres}
                </div>

                {/* Projets */}
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <FolderOpen className="size-3.5 text-muted-foreground" />
                  {cohorte.nb_projets}
                </div>

                {/* Statut */}
                <div>
                  <CohorteStatusBadge statut={cohorte.statut} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    id={`view-cohort-${cohorte.id}`}
                    onClick={() => handleView(cohorte.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                      bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Eye className="size-3.5" />
                    Voir Détails
                  </button>
                  <button
                    id={`edit-cohort-${cohorte.id}`}
                    onClick={() => handleEdit(cohorte.id)}
                    className="size-7 flex items-center justify-center rounded-lg
                      text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cartes mobile ─────────────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          // Skeleton mobile
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-10 bg-muted rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : cohortes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Aucune cohorte trouvée.
          </div>
        ) : (
          cohortes.map((cohorte) => (
            <CohortCard
              key={cohorte.id}
              cohorte={cohorte}
              onView={handleView}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>

      {/* Modal de création */}
      <CreateCohortModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
