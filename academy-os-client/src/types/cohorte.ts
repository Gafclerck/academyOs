/**
 * Types TypeScript – Module Gestion des Cohortes
 * Hiérarchie : Programme > Session > Cohorte > Projet
 *
 * Ce fichier est la source de vérité pour tous les types du module.
 * Brancher sur le vrai backend : adapter les champs selon la réponse API réelle.
 */

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  nom: string;
  programme_id: string;
  programme_nom?: string;
}

// ─── Cohorte ──────────────────────────────────────────────────────────────────

export type CohorteStatut = 'active' | 'terminee';

export interface Cohorte {
  id: string;
  nom: string;
  session_id: string;
  /** Nom de la session parente (jointure backend ou enrichi côté client) */
  session_nom?: string;
  /** Format ISO "YYYY-MM-DD" */
  date_debut: string;
  /** Format ISO "YYYY-MM-DD" */
  date_fin: string;
  nb_membres: number;
  nb_projets: number;
  statut: CohorteStatut;
}

// ─── Payload de création ──────────────────────────────────────────────────────

export interface CreateCohortePayload {
  nom: string;
  session_id: string;
  date_debut: string;
  date_fin: string;
}

// ─── Membres d'une cohorte ────────────────────────────────────────────────────

export interface MembreCohorte {
  id: string;
  nom: string;
  email: string;
  role: string;
}

// ─── Projets d'une cohorte ────────────────────────────────────────────────────

export interface ProjetCohorte {
  id: string;
  nom: string;
  /** Pourcentage d'avancement : 0-100 */
  progression: number;
}

// ─── Filtres de liste ─────────────────────────────────────────────────────────

export interface CohorteFilters {
  statut?: CohorteStatut | 'toutes';
  session_id?: string;
  search?: string;
}
