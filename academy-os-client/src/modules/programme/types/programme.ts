/**
 * Types TypeScript pour le Module Programme (Xarala Academy OS)
 * Hiérarchie : PROGRAMME > SESSION > COHORTE > PROJET
 */

export type StatutProgramme = 'actif' | 'inactif';
export type StatutSession = 'a_venir' | 'en_cours' | 'terminee';
export type StatutCohorte = 'active' | 'terminee';
export type StatutProjet = 'en_cours' | 'termine' | 'en_attente' | 'abandonne';

// ─── 1. PROGRAMME ────────────────────────────────────────────────────────────

export interface Programme {
  id: string;
  nom: string;
  description: string;
  duree_mois: number;
  statut: StatutProgramme;
  nb_sessions?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProgrammeDTO {
  nom: string;
  description: string;
  duree_mois: number;
  statut: StatutProgramme;
}

// ─── 2. SESSION ──────────────────────────────────────────────────────────────

export interface SessionProgramme {
  id: string;
  programme_id: string;
  programme_nom?: string;
  nom: string;
  date_debut: string; // ISO YYYY-MM-DD
  date_fin: string;   // ISO YYYY-MM-DD
  statut: StatutSession;
  nb_cohortes?: number;
  nb_membres?: number;
  nb_projets?: number;
  created_at?: string;
}

export interface CreateSessionDTO {
  programme_id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
}

// ─── 3. COHORTE ──────────────────────────────────────────────────────────────

export interface CohorteSession {
  id: string;
  session_id: string;
  session_nom?: string;
  programme_id?: string;
  programme_nom?: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  statut: StatutCohorte;
  nb_membres: number;
  nb_projets: number;
  created_at?: string;
}

export interface CreateCohorteDTO {
  session_id: string;
  nom: string;
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
  session_id?: string;
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
  total_sessions: number;
  total_etudiants: number;
}

export interface ProgrammeDetailKPIs {
  nb_sessions: number;
  nb_cohortes_totales: number;
  nb_etudiants: number;
}

export interface SessionDetailKPIs {
  nb_cohortes: number;
  nb_membres: number;
  nb_projets: number;
}

export interface CohorteDetailKPIs {
  session_nom: string;
  programme_nom: string;
  nb_membres: number;
  nb_projets: number;
}
