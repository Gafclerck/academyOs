/**
 * Types TypeScript pour le Module Programme
 * Xarala Academy OS
 *
 * Hiérarchie :
 * PROGRAMME > RENTRÉE > COHORTE > PROJET
 */

/* ============================================================
   STATUTS
============================================================ */

export type StatutProgramme =
  | 'actif'
  | 'inactif';

export type StatutRentree =
  | 'a_venir'
  | 'en_cours'
  | 'terminee';

export type StatutCohorte =
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'active'
  | 'terminee'
  | 'inactive';

export type StatutProjet =
  | 'en_cours'
  | 'termine'
  | 'en_attente'
  | 'abandonne';

/* ============================================================
   1. PROGRAMME
============================================================ */

export interface Programme {
  id: string;
  nom: string;
  description: string;
  statut: StatutProgramme;

  nb_rentrees?: number;

  created_at?: string;
  updated_at?: string;
}

export interface CreateProgrammeDTO {
  nom: string;
  description: string;
  statut: StatutProgramme;
}

/* ============================================================
   2. RENTRÉE
============================================================ */

export interface RentreeProgramme {
  id: string;

  /**
   * Programme auquel appartient la rentrée
   */
  programme_id: string;

  programme_nom?: string;

  nom: string;

  description?: string;

  date_debut: string;
  date_fin: string;

  statut: StatutRentree;

  nb_cohortes?: number;
  nb_membres?: number;
  nb_projets?: number;

  created_at?: string;
  updated_at?: string;
}

export interface CreateRentreeDTO {
  programme_id: string;

  nom: string;

  description?: string;

  date_debut: string;
  date_fin: string;
}

/* ============================================================
   3. COHORTE
============================================================ */

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
  updated_at?: string;
}

export interface CreateCohorteDTO {
  rentree_id: string;

  nom: string;

  description?: string;

  date_debut: string;
  date_fin: string;
}

/* ============================================================
   4. PROJET
============================================================ */

export interface ProjetCohorte {
  id: string;

  cohorte_id: string;

  nom: string;

  description: string;

  progression: number;

  statut: StatutProjet;

  nb_membres: number;

  date_debut?: string;

  date_fin_prevue?: string;
}

export interface CreateProjetDTO {
  cohorte_id: string;

  nom: string;

  description?: string;

  date_debut?: string;

  date_fin_prevue?: string;
}

/* ============================================================
   5. MEMBRE
============================================================ */

export interface Membre {
  id: string;

  cohorte_id?: string;

  rentree_id?: string;

  nom: string;

  prenom: string;

  email: string;

  role:
    | 'etudiant'
    | 'mentor'
    | 'lead'
    | 'admin';

  avatar?: string;

  date_rejoint?: string;
}

export interface CreateMembreDTO {
  cohorte_id: string;

  rentree_id: string;

  nom: string;

  prenom: string;

  email: string;

  role:
    | 'etudiant'
    | 'mentor'
    | 'lead'
    | 'admin';
}

export interface UpdateMembreDTO {
  role?:
    | 'etudiant'
    | 'mentor'
    | 'lead'
    | 'admin';
}

/* ============================================================
   6. KPI
============================================================ */

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

/* ============================================================
   7. CERTIFICAT
============================================================ */

export interface Certificat {
  id: string;

  cohorte_id: string;

  membre_id: string;

  nom_apprenant: string;

  prenom_apprenant: string;

  nom_projet?: string;

  date_obtention: string;

  score?: number;

  lien_download?: string;
}

export interface CreateCertificatDTO {
  cohorte_id: string;

  membre_id: string;

  nom_projet?: string;

  score?: number;
}

/* ============================================================
   8. SOUMISSION
============================================================ */

export interface SoumissionProjet {
  id: string;

  projet_id: string;

  cohorte_id: string;

  membre_id: string;

  nom_apprenant: string;

  prenom_apprenant: string;

  fichier_url?: string;

  commentaire?: string;

  statut:
    | 'soumis'
    | 'en_correction'
    | 'corrige'
    | 'accepte'
    | 'refuse';

  score?: number;

  feedback?: string;

  date_soumission: string;

  date_review?: string;
}

export interface CreateSoumissionDTO {
  projet_id: string;

  cohorte_id: string;

  membre_id: string;

  fichier_url?: string;

  commentaire?: string;
}

/* ============================================================
   9. REVIEW
============================================================ */

export interface ReviewProjet {
  id: string;

  soumission_id: string;

  correcteur_id: string;

  correcteur_nom: string;

  score: number;

  feedback: string;

  date_review: string;
}

export interface CreateReviewDTO {
  soumission_id: string;

  score: number;

  feedback: string;
}

/* ============================================================
   10. BACKEND USERS
============================================================ */

export interface BackendUser {
  id: string;

  email: string;

  first_name: string;

  last_name: string;

  full_name: string;

  role:
    | 'admin'
    | 'organizer'
    | 'trainer'
    | 'learner';

  status:
    | 'pending'
    | 'active'
    | 'suspended'
    | 'archived';

  phone_number?: string;

  created_at: string;
}

export interface BackendMentor {
  id: string;

  user: BackendUser;

  status:
    | 'active'
    | 'completed'
    | 'suspended';

  assigned_at: string;
}

export interface BackendEnrollment {
  id: string;

  user: BackendUser;

  cohort: string;

  status:
    | 'active'
    | 'completed'
    | 'dropped'
    | 'suspended';

  enrolled_at: string;

  mentor: BackendMentor | null;
}

export interface BackendTrainerAssignment {
  id: string;

  user: BackendUser;

  cohort: string;

  status:
    | 'active'
    | 'completed'
    | 'suspended';

  assigned_at: string;
}

/* ============================================================
   11. BATCH MEMBERS
============================================================ */

export interface MemberBatchResultItem {
  email: string;

  status: string;

  detail: string;
}

export interface MemberBatchResult {
  results: MemberBatchResultItem[];
}

export interface AssignMentorPayload {
  mentor: string | null;
}

export interface AddMembersPayload {
  emails: string[];
}

/* ============================================================
   12. LEGACY ALIASES
============================================================ */

export type SessionProgramme =
  RentreeProgramme;

export type CreateSessionDTO =
  CreateRentreeDTO;

export type CohorteSession =
  CohorteRentree;

export type StatutSession =
  StatutRentree;