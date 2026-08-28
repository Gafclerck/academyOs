/**
 * Types TypeScript pour le Module Programme
 * Xarala Academy OS
 *
 * Hiérarchie :
 * PROGRAMME > RENTRÉE > COHORTE > PROJET
 *
 * Les types Rentrée/Cohorte canoniques vivent dans
 * `types/rentree.ts` et `types/cohorte.ts`. Ce fichier ne
 * contient que le domaine PROGRAMME et les types backend partagés.
 */

/* ============================================================
   STATUTS
============================================================ */

export type StatutProgramme =
  | 'actif'
  | 'inactif';

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
   KPI
============================================================ */

export interface ProgrammeKPIs {
  total_programmes: number;

  programmes_actifs: number;

  total_rentrees: number;

  total_etudiants: number;
}

/* ============================================================
   CERTIFICAT (gestion admin / organisateur)
   Aligné sur apps/certificates/serializers.py ->
   CertificateAdminSerializer. Statuts réels : EN_ATTENTE | ENVOYE.
============================================================ */

export type StatutCertificat = 'EN_ATTENTE' | 'ENVOYE'

export interface CertificateAdminItem {
  id: string
  learner_name: string
  learner_email: string
  program_title: string
  cohort_name: string
  program_id: string
  cohort_id: string
  status: StatutCertificat
  date_generation: string | null
  date_envoi: string | null
  file_path: string | null
  url: string | null
  sent_by: string | null
}

export interface CertificateSendResult {
  id: string
  ok: boolean
  status: 'sent' | 'skipped' | 'not_found' | 'error'
}

export interface CertificateSendPayload {
  ids: string[]
}

/* ============================================================
   BACKEND USERS
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
   BATCH MEMBERS
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
