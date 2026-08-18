import axios from 'axios';
import type {
  Programme,
  CreateProgrammeDTO,
  RentreeProgramme,
  CreateRentreeDTO,
  CohorteRentree,
  CreateCohorteDTO,
  ProjetCohorte,
  Membre,
  ProgrammeKPIs,
  ProgrammeDetailKPIs,
  RentreeDetailKPIs,
  CohorteDetailKPIs,
} from '../types/programme';

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

// ─── LOCAL / MOCK STORE AVEC PERSISTANCE ─────────────────────────────────────

const INITIAL_PROGRAMMES: Programme[] = [
  {
    id: 'prog-1',
    nom: 'Developpement Web Fullstack',
    description: 'Formation intensive React, Node.js, TypeScript, PostgreSQL et DevOps moderne.',
    duree_mois: 6,
    statut: 'actif',
    nb_rentrees: 3,
    created_at: '2026-01-10',
  },
  {
    id: 'prog-2',
    nom: 'Data Science & Intelligence Artificielle',
    description: 'Maitrisez Python, Machine Learning, Deep Learning et Data Engineering.',
    duree_mois: 9,
    statut: 'actif',
    nb_rentrees: 2,
    created_at: '2026-02-15',
  },
  {
    id: 'prog-3',
    nom: 'UI/UX Product Design',
    description: 'Conception d\'interfaces modernes, Design Systems, Figma et recherche utilisateur.',
    duree_mois: 4,
    statut: 'actif',
    nb_rentrees: 2,
    created_at: '2026-03-01',
  },
  {
    id: 'prog-4',
    nom: 'Cybersecurite & Reseaux',
    description: 'Audit de securite, pentesting, securisation cloud et gouvernance informatique.',
    duree_mois: 6,
    statut: 'inactif',
    nb_rentrees: 1,
    created_at: '2025-11-20',
  },
];

const INITIAL_RENTREES: RentreeProgramme[] = [
  {
    id: 'rent-1',
    programme_id: 'prog-1',
    programme_nom: 'Developpement Web Fullstack',
    nom: 'Rentree Hiver 2026',
    date_debut: '2026-01-15',
    date_fin: '2026-07-15',
    statut: 'en_cours',
    nb_cohortes: 2,
    nb_membres: 48,
    nb_projets: 8,
    created_at: '2026-01-05',
  },
  {
    id: 'rent-2',
    programme_id: 'prog-1',
    programme_nom: 'Developpement Web Fullstack',
    nom: 'Rentree Printemps 2026',
    date_debut: '2026-04-01',
    date_fin: '2026-10-01',
    statut: 'en_cours',
    nb_cohortes: 1,
    nb_membres: 25,
    nb_projets: 4,
    created_at: '2026-03-10',
  },
  {
    id: 'rent-3',
    programme_id: 'prog-1',
    programme_nom: 'Developpement Web Fullstack',
    nom: 'Rentree Automne 2026',
    date_debut: '2026-09-15',
    date_fin: '2027-03-15',
    statut: 'a_venir',
    nb_cohortes: 0,
    nb_membres: 0,
    nb_projets: 0,
    created_at: '2026-06-01',
  },
  {
    id: 'rent-4',
    programme_id: 'prog-2',
    programme_nom: 'Data Science & Intelligence Artificielle',
    nom: 'Rentree Printemps 2026',
    date_debut: '2026-03-01',
    date_fin: '2026-12-01',
    statut: 'en_cours',
    nb_cohortes: 2,
    nb_membres: 36,
    nb_projets: 6,
    created_at: '2026-02-20',
  },
  {
    id: 'rent-5',
    programme_id: 'prog-3',
    programme_nom: 'UI/UX Product Design',
    nom: 'Rentree Ete 2026',
    date_debut: '2026-06-01',
    date_fin: '2026-10-01',
    statut: 'a_venir',
    nb_cohortes: 1,
    nb_membres: 18,
    nb_projets: 3,
    created_at: '2026-05-10',
  },
];

const INITIAL_COHORTES: CohorteRentree[] = [
  {
    id: 'coh-1',
    rentree_id: 'rent-1',
    rentree_nom: 'Rentree Hiver 2026',
    programme_id: 'prog-1',
    programme_nom: 'Developpement Web Fullstack',
    nom: 'Cohorte Baol Tech 1',
    date_debut: '2026-01-15',
    date_fin: '2026-07-15',
    statut: 'active',
    nb_membres: 24,
    nb_projets: 4,
  },
  {
    id: 'coh-2',
    rentree_id: 'rent-1',
    rentree_nom: 'Rentree Hiver 2026',
    programme_id: 'prog-1',
    programme_nom: 'Developpement Web Fullstack',
    nom: 'Cohorte Dakar Alpha',
    date_debut: '2026-01-15',
    date_fin: '2026-07-15',
    statut: 'active',
    nb_membres: 24,
    nb_projets: 4,
  },
  {
    id: 'coh-3',
    rentree_id: 'rent-2',
    rentree_nom: 'Rentree Printemps 2026',
    programme_id: 'prog-1',
    programme_nom: 'Developpement Web Fullstack',
    nom: 'Cohorte Saloum Dev',
    date_debut: '2026-04-01',
    date_fin: '2026-10-01',
    statut: 'active',
    nb_membres: 25,
    nb_projets: 4,
  },
  {
    id: 'coh-4',
    rentree_id: 'rent-4',
    rentree_nom: 'Rentree Printemps 2026',
    programme_id: 'prog-2',
    programme_nom: 'Data Science & Intelligence Artificielle',
    nom: 'Cohorte IA Xarala 1',
    date_debut: '2026-03-01',
    date_fin: '2026-12-01',
    statut: 'active',
    nb_membres: 18,
    nb_projets: 3,
  },
];

const INITIAL_PROJETS: Record<string, ProjetCohorte[]> = {
  'coh-1': [
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
      cohorte_id: 'coh-1',
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
      cohorte_id: 'coh-1',
      nom: 'Hub Communautaire & Forum Tech',
      description: 'Espace d\'echange et entraide pour les developpeurs de l\'academie.',
      progression: 40,
      statut: 'en_cours',
      nb_membres: 6,
      date_debut: '2026-03-15',
      date_fin_prevue: '2026-07-01',
    },
  ],
};

const INITIAL_MEMBRES: Record<string, Membre[]> = {
  'coh-1': [
    { id: 'm-1', cohorte_id: 'coh-1', nom: 'Diop', prenom: 'Moussa', email: 'moussa.diop@xarala.co', role: 'etudiant', avatar: 'MD' },
    { id: 'm-2', cohorte_id: 'coh-1', nom: 'Sow', prenom: 'Awa', email: 'awa.sow@xarala.co', role: 'lead', avatar: 'AS' },
    { id: 'm-3', cohorte_id: 'coh-1', nom: 'Fall', prenom: 'Cheikh', email: 'cheikh.fall@xarala.co', role: 'etudiant', avatar: 'CF' },
    { id: 'm-4', cohorte_id: 'coh-1', nom: 'Ndiaye', prenom: 'Fatou', email: 'fatou.ndiaye@xarala.co', role: 'mentor', avatar: 'FN' },
    { id: 'm-5', cohorte_id: 'coh-1', nom: 'Gueye', prenom: 'Ibrahima', email: 'ibrahima.gueye@xarala.co', role: 'etudiant', avatar: 'IG' },
    { id: 'm-6', cohorte_id: 'coh-1', nom: 'Ba', prenom: 'Mariama', email: 'mariama.ba@xarala.co', role: 'etudiant', avatar: 'MB' },
  ],
};

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

const getStored = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`academyos_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`academyos_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Erreur localStorage', e);
  }
};

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── SERVICE PROGRAMME ────────────────────────────────────────────────────────

export const programmeService = {
  // ── 1. PROGRAMMES ──
  async getProgrammes(): Promise<Programme[]> {
    await delay();
    const stored = getStored<Programme[]>('programmes', INITIAL_PROGRAMMES);
    const rentrees = getStored<RentreeProgramme[]>('rentrees', INITIAL_RENTREES);

    // Enrichir avec le compte reel de rentrees
    return stored.map((prog) => ({
      ...prog,
      nb_rentrees: rentrees.filter((r) => r.programme_id === prog.id).length,
    }));
  },

  async getProgrammeById(id: string): Promise<Programme | null> {
    await delay();
    const programmes = await this.getProgrammes();
    return programmes.find((p) => p.id === id) ?? null;
  },

  async createProgramme(dto: CreateProgrammeDTO): Promise<Programme> {
    await delay(350);
    const programmes = getStored<Programme[]>('programmes', INITIAL_PROGRAMMES);
    const newProg: Programme = {
      id: `prog-${Date.now()}`,
      nom: dto.nom,
      description: dto.description,
      duree_mois: dto.duree_mois,
      statut: dto.statut,
      nb_rentrees: 0,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    programmes.unshift(newProg);
    setStored('programmes', programmes);
    return newProg;
  },

  async getProgrammeKPIs(): Promise<ProgrammeKPIs> {
    const programmes = await this.getProgrammes();
    const rentrees = await this.getAllRentrees();
    const cohortes = await this.getAllCohortes();

    const totalStudents = cohortes.reduce((acc, c) => acc + (c.nb_membres || 0), 0);

    return {
      total_programmes: programmes.length,
      programmes_actifs: programmes.filter((p) => p.statut === 'actif').length,
      total_rentrees: rentrees.length,
      total_etudiants: totalStudents,
    };
  },

  async getProgrammeDetailKPIs(programmeId: string): Promise<ProgrammeDetailKPIs> {
    const rentrees = await this.getRentreesByProgramme(programmeId);
    const rentreeIds = rentrees.map((r) => r.id);
    const cohortes = (await this.getAllCohortes()).filter((c) => rentreeIds.includes(c.rentree_id));
    const totalStudents = cohortes.reduce((acc, c) => acc + (c.nb_membres || 0), 0);

    return {
      nb_rentrees: rentrees.length,
      nb_cohortes_totales: cohortes.length,
      nb_etudiants: totalStudents,
    };
  },

  // ── 2. RENTREES ──
  async getAllRentrees(): Promise<RentreeProgramme[]> {
    await delay();
    const rentrees = getStored<RentreeProgramme[]>('rentrees', INITIAL_RENTREES);
    const cohortes = getStored<CohorteRentree[]>('cohortes', INITIAL_COHORTES);

    return rentrees.map((rent) => {
      const rentCohortes = cohortes.filter((c) => c.rentree_id === rent.id);
      return {
        ...rent,
        nb_cohortes: rentCohortes.length,
        nb_membres: rentCohortes.reduce((acc, c) => acc + (c.nb_membres || 0), 0),
        nb_projets: rentCohortes.reduce((acc, c) => acc + (c.nb_projets || 0), 0),
      };
    });
  },

  async getRentreesByProgramme(programmeId: string): Promise<RentreeProgramme[]> {
    const all = await this.getAllRentrees();
    return all.filter((r) => r.programme_id === programmeId);
  },

  async getRentreeById(id: string): Promise<RentreeProgramme | null> {
    const all = await this.getAllRentrees();
    return all.find((r) => r.id === id) ?? null;
  },

  async createRentree(dto: CreateRentreeDTO): Promise<RentreeProgramme> {
    await delay(350);
    const programme = await this.getProgrammeById(dto.programme_id);
    if (!programme) throw new Error('Programme parent introuvable.');

    const rentrees = getStored<RentreeProgramme[]>('rentrees', INITIAL_RENTREES);
    const newRentree: RentreeProgramme = {
      id: `rent-${Date.now()}`,
      programme_id: dto.programme_id,
      programme_nom: programme.nom,
      nom: dto.nom,
      description: dto.description,
      date_debut: dto.date_debut,
      date_fin: dto.date_fin,
      statut: 'en_cours',
      nb_cohortes: 0,
      nb_membres: 0,
      nb_projets: 0,
      created_at: new Date().toISOString().split('T')[0],
    };
    rentrees.unshift(newRentree);
    setStored('rentrees', rentrees);
    return newRentree;
  },

  async getRentreeDetailKPIs(rentreeId: string): Promise<RentreeDetailKPIs> {
    const cohortes = await this.getCohortesByRentree(rentreeId);
    return {
      nb_cohortes: cohortes.length,
      nb_membres: cohortes.reduce((acc, c) => acc + (c.nb_membres || 0), 0),
      nb_projets: cohortes.reduce((acc, c) => acc + (c.nb_projets || 0), 0),
    };
  },

  // ── 3. COHORTES ──
  async getAllCohortes(): Promise<CohorteRentree[]> {
    await delay();
    return getStored<CohorteRentree[]>('cohortes', INITIAL_COHORTES);
  },

  async getCohortesByRentree(rentreeId: string): Promise<CohorteRentree[]> {
    const all = await this.getAllCohortes();
    return all.filter((c) => c.rentree_id === rentreeId);
  },

  async getCohorteById(id: string): Promise<CohorteRentree | null> {
    const all = await this.getAllCohortes();
    return all.find((c) => c.id === id) ?? null;
  },

  async createCohorte(dto: CreateCohorteDTO): Promise<CohorteRentree> {
    await delay(350);
    const rentree = await this.getRentreeById(dto.rentree_id);
    if (!rentree) throw new Error('Rentree parente introuvable.');

    const cohortes = getStored<CohorteRentree[]>('cohortes', INITIAL_COHORTES);
    const newCohorte: CohorteRentree = {
      id: `coh-${Date.now()}`,
      rentree_id: dto.rentree_id,
      rentree_nom: rentree.nom,
      programme_id: rentree.programme_id,
      programme_nom: rentree.programme_nom,
      nom: dto.nom,
      description: dto.description,
      date_debut: dto.date_debut,
      date_fin: dto.date_fin,
      statut: 'active',
      nb_membres: 0,
      nb_projets: 0,
      created_at: new Date().toISOString().split('T')[0],
    };
    cohortes.unshift(newCohorte);
    setStored('cohortes', cohortes);
    return newCohorte;
  },

  async getCohorteDetailKPIs(cohorteId: string): Promise<CohorteDetailKPIs> {
    const cohorte = await this.getCohorteById(cohorteId);
    return {
      rentree_nom: cohorte?.rentree_nom || 'Rentree',
      programme_nom: cohorte?.programme_nom || 'Programme',
      nb_membres: cohorte?.nb_membres || 0,
      nb_projets: cohorte?.nb_projets || 0,
    };
  },

  // ── 4. PROJETS & MEMBRES ──
  async getProjetsByCohorte(cohorteId: string): Promise<ProjetCohorte[]> {
    await delay();
    const stored = getStored<Record<string, ProjetCohorte[]>>('projets', INITIAL_PROJETS);
    return stored[cohorteId] || [];
  },

  async getMembresByCohorte(cohorteId: string): Promise<Membre[]> {
    await delay();
    const stored = getStored<Record<string, Membre[]>>('membres', INITIAL_MEMBRES);
    return stored[cohorteId] || [];
  },
};
