/**
 * Types TypeScript pour le Module Programme (Xarala Academy OS)
 * Hiérarchie : PROGRAMME > RENTRÉE > COHORTE > PROJET
 */

export type StatutProgramme = 'actif' | 'inactif';
export type StatutRentree = 'a_venir' | 'en_cours' | 'terminee';
export type StatutCohorte = 'active' | 'terminee';
export type StatutProjet = 'en_cours' | 'termine' | 'en_attente' | 'abandonne';

// ─── 1. PROGRAMME ────────────────────────────────────────────────────────────

export interface Programme {
  id: string;
  nom: string;
  description: string;
  duree_mois: number;
  statut: StatutProgramme;
  nb_rentrees?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProgrammeDTO {
  nom: string;
  description: string;
  duree_mois: number;
  statut: StatutProgramme;
}

// ─── 2. RENTRÉE ──────────────────────────────────────────────────────────────

export interface RentreeProgramme {
  id: string;
  programme_id: string;
  programme_nom?: string;
  nom: string;
  description?: string;
  date_debut: string; // ISO YYYY-MM-DD
  date_fin: string;   // ISO YYYY-MM-DD
  statut: StatutRentree;
  nb_cohortes?: number;
  nb_membres?: number;
  nb_projets?: number;
  created_at?: string;
}

export interface CreateRentreeDTO {
  programme_id: string;
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
}

// ─── 3. COHORTE ──────────────────────────────────────────────────────────────

export interface CohorteRentree {
  id: string;
  rentree_id: string;
  rentree_nom?: string;
  programme_id?: string;
  programme_nom?: string;
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  statut: StatutCohorte;
  nb_membres: number;
  nb_projets: number;
  created_at?: string;
}

export interface CreateCohorteDTO {
  rentree_id: string;
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
}

// ─── 4. PROJET ───────────────────────────────────────────────────────────────

export interface ProjetCohorte {
  id: string;
  cohorte_id: string;
  nom: string;
  description: string;
  progression: number; // 0-100
  statut: StatutProjet;
  nb_membres: number;
  date_debut?: string;
  date_fin_prevue?: string;
}

// ─── 5. MEMBRE ───────────────────────────────────────────────────────────────

export interface Membre {
  id: string;
  cohorte_id?: string;
  rentree_id?: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'etudiant' | 'mentor' | 'lead' | 'admin';
  avatar?: string;
  date_rejoint?: string;
}

// ─── 6. KPIs & STATISTIQUES ──────────────────────────────────────────────────

export interface ProgrammeKPIs {
  total_programmes: number;
  programmes_actifs: number;
  total_rentrees: number;
  total_etudiants: number;
}

export interface ProgrammeDetailKPIs {
  nb_rentrees: number;
  nb_cohortes_totales: number;
  nb_etudiants: number;
}

export interface RentreeDetailKPIs {
  nb_cohortes: number;
  nb_membres: number;
  nb_projets: number;
}

export interface CohorteDetailKPIs {
  rentree_nom: string;
  programme_nom: string;
  nb_membres: number;
  nb_projets: number;
}

// ─── 7. ALIASES DE COMPATIBILITÉ (legacy) ────────────────────────────────────
// À supprimer progressivement

/** @deprecated Utiliser RentreeProgramme */
export type SessionProgramme = RentreeProgramme;
/** @deprecated Utiliser CreateRentreeDTO */
export type CreateSessionDTO = CreateRentreeDTO;
/** @deprecated Utiliser CohorteRentree */
export type CohorteSession = CohorteRentree;
/** @deprecated Utiliser StatutRentree */
export type StatutSession = StatutRentree;
