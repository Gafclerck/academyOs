/**
 * Types TypeScript – Module Gestion des Cohortes
 * Hiérarchie : Programme > Rentrée > Cohorte > Projet
 *
 * Ce fichier est la source de vérité pour tous les types du module.
 * Brancher sur le vrai backend : adapter les champs selon la réponse API réelle.
 */

// ─── Rentrée ──────────────────────────────────────────────────────────────────

export interface Rentree {
  id: string;
  nom: string;
  programme_id: string;
  programme_nom?: string;
}

/** @deprecated Utiliser Rentree */
export type Session = Rentree;

// ─── Cohorte ──────────────────────────────────────────────────────────────────

export type CohorteStatut = 'active' | 'terminee';

export interface Cohorte {
  id: string;
  nom: string;
  rentree_id: string;
  /** Nom de la rentrée parente (jointure backend ou enrichi côté client) */
  rentree_nom?: string;
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
  rentree_id: string;
  date_debut: string;
  date_fin: string;
}

// ─── Membres d'une cohorte ────────────────────────────────────────────────────

export interface MembreCohorte {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  role: string;
  avatar?: string;
  date_rejoint?: string;
}

// ─── Projets d'une cohorte ────────────────────────────────────────────────────

export interface ProjetCohorte {
  id: string;
  nom: string;
  description?: string;
  /** Pourcentage d'avancement : 0-100 */
  progression?: number;
  etat_avancement?: number;
  statut?: ProjetStatut;
  nb_membres?: number;
  date_debut?: string;
  date_fin_prevue?: string;
}



// ─── Filtres de liste ─────────────────────────────────────────────────────────

export interface CohorteFilters {
  statut?: CohorteStatut | 'toutes';
  rentree_id?: string;
  /** @deprecated Utiliser rentree_id */
  session_id?: string;
  search?: string;
}

// ─── Aliases pour rétrocompatibilité ──────────────────────────────────────────

export type ProjetStatut = 'en_cours' | 'termine' | 'en_attente' | 'abandonne';
export type Membre = MembreCohorte;
export type Projet = ProjetCohorte;


