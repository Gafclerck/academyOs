/**
 * Service API - Gestion des Projets (mock)
 */

import axios from 'axios';
import type { ProjetCohorte, CreateProjetDTO } from '@/types/programme';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const serverMsg = (err.response?.data as { message?: string })?.message;
    return serverMsg ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

const USE_MOCK = true;

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_PROJETS: ProjetCohorte[] = [
  {
    id: 'proj-1',
    cohorte_id: 'coh-1',
    nom: 'Plateforme E-learning Xarala',
    description: 'Developpement d\'une plateforme SaaS complete de cours en ligne avec video et quiz.',
    progression: 85,
    statut: 'en_cours',
    nb_membres: 6,
    date_debut: '2026-02-01',
    date_fin_prevue: '2026-06-30',
  },
  {
    id: 'proj-2',
    cohorte_id: 'coh-1',
    nom: 'Systeme de Facturation & Paiement Wave / OM',
    description: 'API et dashboard pour integrer les paiements mobiles locaux au Senegal.',
    progression: 100,
    statut: 'termine',
    nb_membres: 5,
    date_debut: '2026-01-20',
    date_fin_prevue: '2026-04-15',
  },
  {
    id: 'proj-3',
    cohorte_id: 'coh-2',
    nom: 'Application Mobile de Gestion Agricole',
    description: 'Application React Native pour le suivi des recoltes et des stocks dans la region de Diourbel.',
    progression: 60,
    statut: 'en_cours',
    nb_membres: 7,
    date_debut: '2026-03-01',
    date_fin_prevue: '2026-07-10',
  },
  {
    id: 'proj-4',
    cohorte_id: 'coh-2',
    nom: 'Hub Communautaire & Forum Tech',
    description: 'Espace d\'echange et entraide pour les developpeurs de l\'academie.',
    progression: 40,
    statut: 'en_cours',
    nb_membres: 6,
    date_debut: '2026-03-15',
    date_fin_prevue: '2026-07-01',
  },
  {
    id: 'proj-5',
    cohorte_id: 'coh-3',
    nom: 'Marketplace Artisans',
    description: 'Mise en relation avec les artisans locaux du Senegal.',
    progression: 75,
    statut: 'en_cours',
    nb_membres: 4,
    date_debut: '2026-01-10',
    date_fin_prevue: '2026-06-30',
  },
];

export async function getProjets(filters?: { cohorte_id?: string; search?: string }): Promise<ProjetCohorte[]> {
  try {
    if (USE_MOCK) {
      await delay();
      let result = [...MOCK_PROJETS];
      if (filters?.cohorte_id) {
        result = result.filter((p) => p.cohorte_id === filters.cohorte_id);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        result = result.filter((p) => p.nom.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }
      return result;
    }
    const { data } = await api.get<ProjetCohorte[]>('/projets', { params: filters });
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les projets.'));
  }
}

export async function getProjetById(id: string): Promise<ProjetCohorte | null> {
  try {
    if (USE_MOCK) {
      await delay();
      return MOCK_PROJETS.find((p) => p.id === id) ?? null;
    }
    const { data } = await api.get<ProjetCohorte>(`/projets/${id}`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger ce projet.'));
  }
}

export async function createProjet(payload: CreateProjetDTO): Promise<ProjetCohorte> {
  try {
    if (USE_MOCK) {
      await delay(500);
      const newProjet: ProjetCohorte = {
        id: `proj-${Date.now()}`,
        cohorte_id: payload.cohorte_id,
        nom: payload.nom,
        description: payload.description || '',
        progression: 0,
        statut: 'en_attente',
        nb_membres: 0,
        date_debut: payload.date_debut,
        date_fin_prevue: payload.date_fin_prevue,
      };
      MOCK_PROJETS.push(newProjet);
      return newProjet;
    }
    const { data } = await api.post<ProjetCohorte>('/projets', payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de creer le projet.'));
  }
}
