/**
 * Service API – Gestion des Cohortes
 *
 * Base URL : /api (proxied par Vite ou configurable via VITE_API_BASE_URL)
 *
 * Toutes les fonctions gèrent leur propre try/catch et re-throw une Error
 * typée pour que les composants consommateurs puissent afficher le bon message.
 *
 * Pour basculer sur le vrai backend :
 *   1. Supprimer le flag USE_MOCK (ou mettre VITE_USE_MOCK=false dans .env)
 *   2. S'assurer que le proxy Vite ou CORS est configuré sur /api
 */

import axios, { AxiosError } from 'axios';
import type {
  Cohorte,
  Session,
  MembreCohorte,
  ProjetCohorte,
  CreateCohortePayload,
  CohorteFilters,
} from '@/types/cohorte';

// ─── Client Axios ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// Injecte le token JWT dans chaque requête
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

// ─── Helper : extraire le message d'erreur ────────────────────────────────────

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    // Message venant du backend (ex: { message: "..." })
    const serverMsg = (err.response?.data as { message?: string })?.message;
    return serverMsg ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Mock data (supprimable quand le backend est prêt) ────────────────────────

const USE_MOCK = true; // ← Mettre false (ou VITE_USE_MOCK=false) pour le vrai backend

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_SESSIONS: Session[] = [
  { id: 'sess-1', nom: 'Session Printemps 2024', programme_id: 'prog-1', programme_nom: 'Dev Web Full Stack' },
  { id: 'sess-2', nom: 'Session Automne 2024',  programme_id: 'prog-1', programme_nom: 'Dev Web Full Stack' },
  { id: 'sess-3', nom: 'Session Hiver 2025',    programme_id: 'prog-2', programme_nom: 'Data Science & IA' },
];

const MOCK_COHORTES: Cohorte[] = [
  { id: 'coh-1', nom: 'Cohorte Alpha',   session_id: 'sess-1', session_nom: 'Session Printemps 2024', date_debut: '2024-02-01', date_fin: '2024-05-31', nb_membres: 24, nb_projets: 6, statut: 'terminee' },
  { id: 'coh-2', nom: 'Cohorte Bêta',   session_id: 'sess-2', session_nom: 'Session Automne 2024',  date_debut: '2024-09-01', date_fin: '2024-12-20', nb_membres: 30, nb_projets: 8, statut: 'terminee' },
  { id: 'coh-3', nom: 'Cohorte Gamma',  session_id: 'sess-3', session_nom: 'Session Hiver 2025',    date_debut: '2025-01-15', date_fin: '2025-06-30', nb_membres: 28, nb_projets: 7, statut: 'active'   },
  { id: 'coh-4', nom: 'Cohorte Delta',  session_id: 'sess-3', session_nom: 'Session Hiver 2025',    date_debut: '2025-02-01', date_fin: '2025-07-31', nb_membres: 22, nb_projets: 5, statut: 'active'   },
  { id: 'coh-5', nom: 'Cohorte Epsilon',session_id: 'sess-3', session_nom: 'Session Hiver 2025',    date_debut: '2025-06-01', date_fin: '2025-11-30', nb_membres: 18, nb_projets: 4, statut: 'active'   },
];

const MOCK_MEMBRES: Record<string, MembreCohorte[]> = {
  'coh-3': [
    { id: 'm-1', nom: 'Mamadou Diallo',  email: 'mamadou@xarala.sn',  role: 'Étudiant' },
    { id: 'm-2', nom: 'Fatou Ndiaye',    email: 'fatou@xarala.sn',    role: 'Étudiant' },
    { id: 'm-3', nom: 'Mariam Traoré',   email: 'mariam@xarala.sn',   role: 'Mentor'   },
    { id: 'm-4', nom: 'Omar Mbaye',      email: 'omar@xarala.sn',     role: 'Étudiant' },
    { id: 'm-5', nom: 'Rokhaya Sarr',    email: 'rokhaya@xarala.sn',  role: 'Étudiant' },
  ],
  'coh-4': [
    { id: 'm-6', nom: 'Seydou Touré',    email: 'seydou@xarala.sn',   role: 'Étudiant' },
    { id: 'm-7', nom: 'Ndeye Dembélé',   email: 'ndeye@xarala.sn',    role: 'Mentor'   },
    { id: 'm-8', nom: 'Pape Gueye',      email: 'pape@xarala.sn',     role: 'Étudiant' },
  ],
  'coh-5': [
    { id: 'm-9', nom: 'Saliou Diop',     email: 'saliou@xarala.sn',   role: 'Étudiant' },
    { id: 'm-10',nom: 'Rosalie Mendy',   email: 'rosalie@xarala.sn',  role: 'Étudiant' },
    { id: 'm-11',nom: 'Landing Faye',    email: 'landing@xarala.sn',  role: 'Mentor'   },
  ],
};

const MOCK_PROJETS: Record<string, ProjetCohorte[]> = {
  'coh-3': [
    { id: 'p-1', nom: 'Marketplace Artisans',      progression: 85  },
    { id: 'p-2', nom: 'App Gestion Scolaire',       progression: 100 },
    { id: 'p-3', nom: 'Dashboard RH Analytics',    progression: 60  },
    { id: 'p-4', nom: 'API REST Bibliothèque',     progression: 100 },
    { id: 'p-5', nom: 'App Mobile Santé',           progression: 40  },
    { id: 'p-6', nom: 'Chatbot IA Support Client',  progression: 20  },
    { id: 'p-7', nom: 'Paiement Mobile Wave',       progression: 0   },
  ],
  'coh-4': [
    { id: 'p-8', nom: 'Réseau Social Académique',  progression: 70 },
    { id: 'p-9', nom: 'Veille Technologique IA',   progression: 50 },
    { id: 'p-10',nom: 'LMS Léger Vidéos + Quiz',   progression: 30 },
    { id: 'p-11',nom: 'Budget Personnel',           progression: 100},
    { id: 'p-12',nom: 'Réservation Restaurant',    progression: 15 },
  ],
  'coh-5': [
    { id: 'p-13',nom: 'Données Agricoles ML',      progression: 25 },
    { id: 'p-14',nom: 'Prédiction Météo IA',        progression: 10 },
    { id: 'p-15',nom: 'NLP Wolof',                  progression: 5  },
    { id: 'p-16',nom: 'Détection Fraude Bancaire', progression: 0  },
  ],
};

// ─── API : Sessions ───────────────────────────────────────────────────────────

/**
 * Récupère toutes les sessions (pour le dropdown du formulaire de création).
 * GET /sessions
 */
export async function getSessions(): Promise<Session[]> {
  try {
    if (USE_MOCK) { await delay(); return MOCK_SESSIONS; }
    const { data } = await api.get<Session[]>('/sessions');
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les sessions.'));
  }
}

// ─── API : Cohortes ───────────────────────────────────────────────────────────

/**
 * Récupère la liste des cohortes avec filtres optionnels.
 * GET /cohortes?statut=active&session_id=...
 */
export async function getCohortes(params?: CohorteFilters): Promise<Cohorte[]> {
  try {
    if (USE_MOCK) {
      await delay();
      let result = [...MOCK_COHORTES];
      if (params?.statut && params.statut !== 'toutes') {
        result = result.filter((c) => c.statut === params.statut);
      }
      if (params?.session_id) {
        result = result.filter((c) => c.session_id === params.session_id);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (c) => c.nom.toLowerCase().includes(q) || c.session_nom?.toLowerCase().includes(q)
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
 * Récupère le détail d'une cohorte par son ID.
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
 * Crée une nouvelle cohorte.
 * POST /cohortes
 */
export async function createCohorte(payload: CreateCohortePayload): Promise<Cohorte> {
  try {
    if (USE_MOCK) {
      await delay(600);
      const session = MOCK_SESSIONS.find((s) => s.id === payload.session_id);
      const newCohorte: Cohorte = {
        id: `coh-${Date.now()}`,
        nom: payload.nom,
        session_id: payload.session_id,
        session_nom: session?.nom,
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
    throw new Error(extractMessage(err, 'Impossible de créer la cohorte.'));
  }
}

// ─── API : Membres ────────────────────────────────────────────────────────────

/**
 * Récupère les membres d'une cohorte.
 * GET /cohortes/:id/membres
 */
export async function getMembresByCohorte(cohortId: string): Promise<MembreCohorte[]> {
  try {
    if (USE_MOCK) {
      await delay();
      return MOCK_MEMBRES[cohortId] ?? [];
    }
    const { data } = await api.get<MembreCohorte[]>(`/cohortes/${cohortId}/membres`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les membres.'));
  }
}

// ─── API : Projets ────────────────────────────────────────────────────────────

/**
 * Récupère les projets d'une cohorte.
 * GET /cohortes/:id/projets
 */
export async function getProjetsByCohorte(cohortId: string): Promise<ProjetCohorte[]> {
  try {
    if (USE_MOCK) {
      await delay();
      return MOCK_PROJETS[cohortId] ?? [];
    }
    const { data } = await api.get<ProjetCohorte[]>(`/cohortes/${cohortId}/projets`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les projets.'));
  }
}

// ─── Aliases ──────────────────────────────────────────────────────────────────
export const getCohortById = getCohorteById;
export const createCohort = createCohorte;
export const getCohortMembers = getMembresByCohorte;
export const getCohortProjects = getProjetsByCohorte;

