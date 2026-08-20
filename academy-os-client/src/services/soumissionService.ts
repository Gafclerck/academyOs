/**
 * Service API - Gestion des Soumissions de Projets (mock)
 */

import axios from 'axios';
import type { SoumissionProjet, CreateSoumissionDTO, ReviewProjet, CreateReviewDTO } from '@/modules/programme/types/programme';

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

const MOCK_MEMBRES: any[] = [
  { id: 'm-1', nom: 'Diop', prenom: 'Moussa' },
  { id: 'm-2', nom: 'Sow', prenom: 'Awa' },
  { id: 'm-3', nom: 'Fall', prenom: 'Cheikh' },
  { id: 'm-4', nom: 'Ndiaye', prenom: 'Fatou' },
  { id: 'm-5', nom: 'Gueye', prenom: 'Ibrahima' },
];

const MOCK_SOUMISSIONS: SoumissionProjet[] = [
  {
    id: 'sub-1',
    projet_id: 'proj-1',
    cohorte_id: 'coh-1',
    membre_id: 'm-1',
    nom_apprenant: 'Diop',
    prenom_apprenant: 'Moussa',
    fichier_url: '#',
    commentaire: 'Projet final prêt pour review',
    statut: 'soumis',
    score: undefined,
    feedback: undefined,
    date_soumission: '2026-06-01',
  },
  {
    id: 'sub-2',
    projet_id: 'proj-1',
    cohorte_id: 'coh-1',
    membre_id: 'm-2',
    nom_apprenant: 'Sow',
    prenom_apprenant: 'Awa',
    fichier_url: '#',
    commentaire: 'Version améliorée avec les retours du mentor',
    statut: 'corrige',
    score: 88,
    feedback: 'Bon travail, attention à la structure du code',
    date_soumission: '2026-05-20',
    date_review: '2026-05-25',
  },
];

const MOCK_REVIEWS: ReviewProjet[] = [
  {
    id: 'rev-1',
    soumission_id: 'sub-2',
    correcteur_id: 'm-4',
    correcteur_nom: 'Fatou Ndiaye',
    score: 88,
    feedback: 'Bon travail, attention à la structure du code',
    date_review: '2026-05-25',
  },
];

export async function getSoumissionsByProjet(projetId: string): Promise<SoumissionProjet[]> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return MOCK_SOUMISSIONS.filter((s) => s.projet_id === projetId);
    }
    const { data } = await api.get<SoumissionProjet[]>(`/projets/${projetId}/soumissions`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les soumissions.'));
  }
}

export async function getSoumissionsByCohorte(cohorteId: string): Promise<SoumissionProjet[]> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return MOCK_SOUMISSIONS.filter((s) => s.cohorte_id === cohorteId);
    }
    const { data } = await api.get<SoumissionProjet[]>(`/cohortes/${cohorteId}/soumissions`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les soumissions.'));
  }
}

export async function createSoumission(payload: CreateSoumissionDTO): Promise<SoumissionProjet> {
  try {
    if (USE_MOCK) {
      await delay(600);
      const membre = MOCK_MEMBRES.find((m: any) => m.id === payload.membre_id);
      const newSoumission: SoumissionProjet = {
        id: `sub-${Date.now()}`,
        projet_id: payload.projet_id,
        cohorte_id: payload.cohorte_id,
        membre_id: payload.membre_id,
        nom_apprenant: membre?.nom || '',
        prenom_apprenant: membre?.prenom || '',
        fichier_url: payload.fichier_url,
        commentaire: payload.commentaire,
        statut: 'soumis',
        date_soumission: new Date().toISOString().split('T')[0],
      };
      MOCK_SOUMISSIONS.push(newSoumission);
      return newSoumission;
    }
    const { data } = await api.post<SoumissionProjet>('/soumissions', payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de creer la soumission.'));
  }
}

export async function createReview(payload: CreateReviewDTO): Promise<ReviewProjet> {
  try {
    if (USE_MOCK) {
      await delay(500);
      const soumission = MOCK_SOUMISSIONS.find((s) => s.id === payload.soumission_id);
      const newReview: ReviewProjet = {
        id: `rev-${Date.now()}`,
        soumission_id: payload.soumission_id,
        correcteur_id: 'current-user',
        correcteur_nom: 'Mentor Actuel',
        score: payload.score,
        feedback: payload.feedback,
        date_review: new Date().toISOString().split('T')[0],
      };
      MOCK_REVIEWS.push(newReview);
      if (soumission) {
        soumission.statut = payload.score >= 50 ? 'accepte' : 'refuse';
        soumission.score = payload.score;
        soumission.feedback = payload.feedback;
        soumission.date_review = newReview.date_review;
      }
      return newReview;
    }
    const { data } = await api.post<ReviewProjet>('/reviews', payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de creer la review.'));
  }
}

export async function getReviewsBySoumission(soumissionId: string): Promise<ReviewProjet[]> {
  try {
    if (USE_MOCK) {
      await delay(400);
      return MOCK_REVIEWS.filter((r) => r.soumission_id === soumissionId);
    }
    const { data } = await api.get<ReviewProjet[]>(`/soumissions/${soumissionId}/reviews`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les reviews.'));
  }
}
