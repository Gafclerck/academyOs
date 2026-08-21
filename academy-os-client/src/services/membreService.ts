/**
 * Service API - Gestion des Membres de Cohorte (mock)
 */

import axios from 'axios';
import type { Membre, CreateMembreDTO, UpdateMembreDTO } from '@/types/programme';

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

const MOCK_MEMBRES: Membre[] = [
  { id: 'm-1', cohorte_id: 'coh-1', rentree_id: 'rent-1', nom: 'Diop', prenom: 'Moussa', email: 'moussa.diop@xarala.co', role: 'etudiant', avatar: 'MD' },
  { id: 'm-2', cohorte_id: 'coh-1', rentree_id: 'rent-1', nom: 'Sow', prenom: 'Awa', email: 'awa.sow@xarala.co', role: 'lead', avatar: 'AS' },
  { id: 'm-3', cohorte_id: 'coh-1', rentree_id: 'rent-1', nom: 'Fall', prenom: 'Cheikh', email: 'cheikh.fall@xarala.co', role: 'etudiant', avatar: 'CF' },
  { id: 'm-4', cohorte_id: 'coh-1', rentree_id: 'rent-1', nom: 'Ndiaye', prenom: 'Fatou', email: 'fatou.ndiaye@xarala.co', role: 'mentor', avatar: 'FN' },
  { id: 'm-5', cohorte_id: 'coh-1', rentree_id: 'rent-1', nom: 'Gueye', prenom: 'Ibrahima', email: 'ibrahima.gueye@xarala.co', role: 'etudiant', avatar: 'IG' },
  { id: 'm-6', cohorte_id: 'coh-2', rentree_id: 'rent-1', nom: 'Ba', prenom: 'Mariama', email: 'mariama.ba@xarala.co', role: 'etudiant', avatar: 'MB' },
  { id: 'm-7', cohorte_id: 'coh-2', rentree_id: 'rent-1', nom: 'Sy', prenom: 'Abdou', email: 'abdou.sy@xarala.co', role: 'etudiant', avatar: 'AS' },
  { id: 'm-8', cohorte_id: 'coh-2', rentree_id: 'rent-1', nom: 'Diallo', prenom: 'Aminata', email: 'aminata.diallo@xarala.co', role: 'mentor', avatar: 'AD' },
];

export async function getMembresByCohorte(cohorteId: string): Promise<Membre[]> {
  try {
    if (USE_MOCK) {
      await delay(500);
      return MOCK_MEMBRES.filter((m) => m.cohorte_id === cohorteId);
    }
    const { data } = await api.get<Membre[]>(`/cohortes/${cohorteId}/membres`);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de charger les membres.'));
  }
}

export async function addMembreToCohorte(cohorteId: string, payload: CreateMembreDTO): Promise<Membre> {
  try {
    if (USE_MOCK) {
      await delay(400);
      const newMembre: Membre = {
        id: `m-${Date.now()}`,
        cohorte_id: cohorteId,
        rentree_id: payload.rentree_id,
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
        role: payload.role,
        avatar: `${payload.prenom[0]}${payload.nom[0]}`.toUpperCase(),
        date_rejoint: new Date().toISOString().split('T')[0],
      };
      MOCK_MEMBRES.push(newMembre);
      return newMembre;
    }
    const { data } = await api.post<Membre>(`/cohortes/${cohorteId}/membres`, payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible d\'ajouter le membre.'));
  }
}

export async function removeMembreFromCohorte(cohorteId: string, membreId: string): Promise<void> {
  try {
    if (USE_MOCK) {
      await delay(400);
      const index = MOCK_MEMBRES.findIndex((m) => m.id === membreId && m.cohorte_id === cohorteId);
      if (index === -1) throw new Error('Membre introuvable dans cette cohorte.');
      MOCK_MEMBRES.splice(index, 1);
      return;
    }
    await api.delete(`/cohortes/${cohorteId}/membres/${membreId}`);
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de retirer le membre.'));
  }
}

export async function updateMembreRole(cohorteId: string, membreId: string, payload: UpdateMembreDTO): Promise<Membre> {
  try {
    if (USE_MOCK) {
      await delay(400);
      const membre = MOCK_MEMBRES.find((m) => m.id === membreId && m.cohorte_id === cohorteId);
      if (!membre) throw new Error('Membre introuvable.');
      Object.assign(membre, payload);
      return { ...membre };
    }
    const { data } = await api.patch<Membre>(`/cohortes/${cohorteId}/membres/${membreId}`, payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err, 'Impossible de mettre a jour le membre.'));
  }
}
