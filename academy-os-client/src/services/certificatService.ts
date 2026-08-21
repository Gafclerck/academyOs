/**
 * Service API - Gestion des Certificats
 *
 * ATTENTION : le backend n'a pas encore de views/serializers/URLs pour les certificats
 * (model-only pour l'instant, cf. apps/certificates/views.py).
 *
 * Ce service reste en mode mock jusqu'à ce que le backend expose les endpoints.
 */

import axios from 'axios';
import type { Certificat, CreateCertificatDTO } from '@/modules/programme/types/programme';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
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

const MOCK_CERTIFICATS: Certificat[] = [
  {
    id: 'cert-1',
    cohorte_id: 'coh-1',
    membre_id: 'm-1',
    nom_apprenant: 'Diop',
    prenom_apprenant: 'Moussa',
    nom_projet: 'Plateforme E-learning Xarala',
    date_obtention: '2026-06-15',
    score: 92,
    lien_download: '#',
  },
  {
    id: 'cert-2',
    cohorte_id: 'coh-1',
    membre_id: 'm-2',
    nom_apprenant: 'Sow',
    prenom_apprenant: 'Awa',
    nom_projet: 'Systeme de Facturation Wave / OM',
    date_obtention: '2026-06-15',
    score: 88,
    lien_download: '#',
  },
  {
    id: 'cert-3',
    cohorte_id: 'coh-1',
    membre_id: 'm-3',
    nom_apprenant: 'Fall',
    prenom_apprenant: 'Cheikh',
    nom_projet: 'App Mobile Gestion Agricole',
    date_obtention: '2026-06-20',
    score: 95,
    lien_download: '#',
  },
];

export async function getCertificatsByCohorte(cohorteId: string): Promise<Certificat[]> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return MOCK_CERTIFICATS.filter((c) => c.cohorte_id === cohorteId);
    }
    const { data } = await api.get<Certificat[]>(`cohortes/${cohorteId}/certificats`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les certificats.'));
  }
}

export async function createCertificat(payload: CreateCertificatDTO): Promise<Certificat> {
  try {
    if (USE_MOCK) {
      await delay(500);
      const newCertificat: Certificat = {
        id: `cert-${Date.now()}`,
        cohorte_id: payload.cohorte_id,
        membre_id: payload.membre_id,
        nom_apprenant: 'Apprenant',
        prenom_apprenant: 'Test',
        nom_projet: payload.nom_projet,
        date_obtention: new Date().toISOString().split('T')[0],
        score: payload.score,
        lien_download: '#',
      };
      MOCK_CERTIFICATS.push(newCertificat);
      return newCertificat;
    }
    const { data } = await api.post<Certificat>('/certificats', payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de creer le certificat.'));
  }
}

export async function downloadCertificat(certificatId: string): Promise<Blob> {
  try {
    if (USE_MOCK) {
      await delay(600);
      return new Blob(['Certificat PDF simulé'], { type: 'application/pdf' });
    }
    const response = await api.get(`certificats/${certificatId}/download`, { responseType: 'blob' });
    return response.data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de telecharger le certificat.'));
  }
}
