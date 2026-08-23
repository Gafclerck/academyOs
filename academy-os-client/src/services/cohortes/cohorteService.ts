/**
 * Service API - Gestion des Cohortes
 *
 * Base URL : /api (proxied par Vite ou configurable via VITE_API_BASE_URL)
 *
 * Toutes les fonctions gerent leur propre try/catch et re-throw une Error
 * typee pour que les composants consommateurs puissent afficher le bon message.
 *
 * Pour basculer sur le vrai backend :
 *   1. Supprimer le flag USE_MOCK (ou mettre VITE_USE_MOCK=false dans .env)
 *   2. S'assurer que le proxy Vite ou CORS est configure sur /api
 */

import axios, { AxiosError } from 'axios';
import { getCohorteMembers } from '@/services/membreService';
import type {
  Cohorte,
  Rentree,
  MembreCohorte,
  CreateCohortePayload,
  CohorteFilters,
} from '@/types/cohorte';
import type { BackendProject } from '@/types/projet';

// --- Client Axios -------------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// Injecte le token JWT dans chaque requete
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirige vers /login si 401
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) window.location.href = '/login';
    return Promise.reject(err);
  }
);

// --- Helper : extraire le message d'erreur ------------------------------------

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    // Message venant du backend (ex: { message: "..." })
    const serverMsg = (err.response?.data as { message?: string })?.message;
    return serverMsg ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// --- Mock data (supprimable quand le backend est pret) ------------------------

const USE_MOCK = true; //  Mettre false (ou VITE_USE_MOCK=false) pour le vrai backend

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_RENTREES: Rentree[] = [
  { id: 'rent-1', nom: 'Rentree Printemps 2024', programme_id: 'prog-1', programme_nom: 'Dev Web Full Stack' },
  { id: 'rent-2', nom: 'Rentree Automne 2024',  programme_id: 'prog-1', programme_nom: 'Dev Web Full Stack' },
  { id: 'rent-3', nom: 'Rentree Hiver 2025',    programme_id: 'prog-2', programme_nom: 'Data Science & IA' },
];


const MOCK_COHORTES: Cohorte[] = [
  { id: 'coh-1', nom: 'Cohorte Alpha',   rentree_id: 'rent-1', rentree_nom: 'Rentree Printemps 2024', date_debut: '2024-02-01', date_fin: '2024-05-31', nb_membres: 24, nb_projets: 6, statut: 'terminee' },
  { id: 'coh-2', nom: 'Cohorte Beta',   rentree_id: 'rent-2', rentree_nom: 'Rentree Automne 2024',  date_debut: '2024-09-01', date_fin: '2024-12-20', nb_membres: 30, nb_projets: 8, statut: 'terminee' },
  { id: 'coh-3', nom: 'Cohorte Gamma',  rentree_id: 'rent-3', rentree_nom: 'Rentree Hiver 2025',    date_debut: '2025-01-15', date_fin: '2025-06-30', nb_membres: 28, nb_projets: 7, statut: 'active'   },
  { id: 'coh-4', nom: 'Cohorte Delta',  rentree_id: 'rent-3', rentree_nom: 'Rentree Hiver 2025',    date_debut: '2025-02-01', date_fin: '2025-07-31', nb_membres: 22, nb_projets: 5, statut: 'active'   },
  { id: 'coh-5', nom: 'Cohorte Epsilon',rentree_id: 'rent-3', rentree_nom: 'Rentree Hiver 2025',    date_debut: '2025-06-01', date_fin: '2025-11-30', nb_membres: 18, nb_projets: 4, statut: 'active'   },
];

// mockProjets supprimé — les projets viennent du vrai backend via getProjetsByCohorte

// --- API : Rentrees ----------------------------------------------------------------

/**
 * Recupere toutes les rentrees (pour le dropdown du formulaire de creation).
 * GET /rentrees
 */
export async function getRentrees(): Promise<Rentree[]> {
  try {
    if (USE_MOCK) { await delay(); return MOCK_RENTREES; }
    const { data } = await api.get<Rentree[]>('/rentrees');
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les rentrees.'));
  }
}

/** @deprecated Utiliser getRentrees */
export const getSessions = getRentrees;

// --- API : Cohortes -----------------------------------------------------------

/**
 * Recupere la liste des cohortes avec filtres optionnels.
 * GET /cohortes?statut=active&rentree_id=...
 */
export async function getCohortes(params?: CohorteFilters): Promise<Cohorte[]> {
  try {
    if (USE_MOCK) {
      await delay();
      let result = [...MOCK_COHORTES];
      if (params?.statut && params.statut !== 'toutes') {
        result = result.filter((c) => c.statut === params.statut);
      }
      if (params?.rentree_id || params?.session_id) {
        const rid = params.rentree_id || params.session_id;
        result = result.filter((c) => c.rentree_id === rid);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (c) => c.nom.toLowerCase().includes(q) || c.rentree_nom?.toLowerCase().includes(q)
        );
      }
      return result;
    }
    const { data } = await api.get<Cohorte[]>('/cohortes', { params });
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les cohortes.'));
  }
}

/**
 * Recupere le detail d'une cohorte par son ID.
 * GET /cohortes/:id
 */
export async function getCohorteById(id: string): Promise<Cohorte> {
  try {
    if (USE_MOCK) {
      await delay();
      const found = MOCK_COHORTES.find((c) => c.id === id);
      if (!found) throw new Error(`Cohorte introuvable (id: ${id})`);
      return found;
    }
    const { data } = await api.get<Cohorte>(`/cohortes/${id}`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger cette cohorte.'));
  }
}

/**
 * Cree une nouvelle cohorte.
 * POST /cohortes
 */
export async function createCohorte(payload: CreateCohortePayload): Promise<Cohorte> {
  try {
    if (USE_MOCK) {
      await delay(600);
      const rentree = MOCK_RENTREES.find((r) => r.id === payload.rentree_id);
      const newCohorte: Cohorte = {
        id: `coh-${Date.now()}`,
        nom: payload.nom,
        rentree_id: payload.rentree_id,
        rentree_nom: rentree?.nom,
        date_debut: payload.date_debut,
        date_fin: payload.date_fin,
        nb_membres: 0,
        nb_projets: 0,
        statut: 'active',
      };
      MOCK_COHORTES.push(newCohorte);
      return newCohorte;
    }
    const { data } = await api.post<Cohorte>('/cohortes', payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de creer la cohorte.'));
  }
}

/**
 * Recupere les membres d'une cohorte via le vrai backend.
 * GET /api/v1/cohorts/:id/enrollments/ + /trainer-assignments/
 */
export async function getMembresByCohorte(cohortId: string): Promise<MembreCohorte[]> {
  try {
    const { students, trainers } = await getCohorteMembers(cohortId);

    const mapEnrollment = (enrollment: {
      id: number;
      user: { first_name: string; last_name: string; email: string };
      role: string;
    }): MembreCohorte => ({
      id: String(enrollment.id),
      nom: enrollment.user.last_name,
      prenom: enrollment.user.first_name,
      email: enrollment.user.email,
      role: enrollment.role === 'student' ? 'etudiant' : enrollment.role === 'mentor' ? 'mentor' : enrollment.role,
    });

    const mapTrainer = (trainer: {
      id: number;
      user: { first_name: string; last_name: string; email: string };
    }): MembreCohorte => ({
      id: String(trainer.id),
      nom: trainer.user.last_name,
      prenom: trainer.user.first_name,
      email: trainer.user.email,
      role: 'formateur',
    });

    return [...students.map(mapEnrollment), ...trainers.map(mapTrainer)];
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les membres.'));
  }
}

/**
 * Recupere les projets d'une cohorte via le vrai backend.
 * GET /api/v1/projects/?cohorte={cohorteId}
 */
export async function getProjetsByCohorte(cohortId: string): Promise<BackendProject[]> {
  try {
    const { getProjets } = await import('@/services/projets/projetService');
    return await getProjets({ cohorte: cohortId });
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les projets.'));
  }
}

// --- Aliases ------------------------------------------------------------------
export const getCohortById = getCohorteById;
export const createCohort = createCohorte;
export const getCohortMembers = getMembresByCohorte;
export const getCohortProjects = getProjetsByCohorte;

