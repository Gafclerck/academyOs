/**
 * Donnees mock pour le module Gestion des Cohortes.
 * Utilisees en developpement quand VITE_USE_MOCK=true ou si le backend est indisponible.
 * Remplacer par les vrais appels API en production.
 */

import type { Cohorte, Membre, Projet } from '@/types/cohorte';

// --- Cohortes mock ------------------------------------------------------------

export const MOCK_COHORTES: Cohorte[] = [
  {
    id: 'coh-001',
    nom: 'Cohorte Alpha',
    rentree_id: 'sess-001',
    rentree_nom: 'Rentree Printemps 2024',
    date_debut: '2024-02-01',
    date_fin: '2024-05-31',
    nb_membres: 24,
    nb_projets: 6,
    statut: 'terminee',
  },
  {
    id: 'coh-002',
    nom: 'Cohorte Beta',
    rentree_id: 'sess-002',
    rentree_nom: 'Rentree Automne 2024',
    date_debut: '2024-09-01',
    date_fin: '2024-12-20',
    nb_membres: 30,
    nb_projets: 8,
    statut: 'terminee',
  },
  {
    id: 'coh-003',
    nom: 'Cohorte Gamma',
    rentree_id: 'sess-003',
    rentree_nom: 'Rentree Hiver 2025',
    date_debut: '2025-01-15',
    date_fin: '2025-06-30',
    nb_membres: 28,
    nb_projets: 7,
    statut: 'active',
  },
  {
    id: 'coh-004',
    nom: 'Cohorte Delta',
    rentree_id: 'sess-003',
    rentree_nom: 'Rentree Hiver 2025',
    date_debut: '2025-02-01',
    date_fin: '2025-07-31',
    nb_membres: 22,
    nb_projets: 5,
    statut: 'active',
  },
  {
    id: 'coh-005',
    nom: 'Cohorte Epsilon',
    rentree_id: 'sess-004',
    rentree_nom: 'Rentree Ete 2025',
    date_debut: '2025-06-01',
    date_fin: '2025-11-30',
    nb_membres: 18,
    nb_projets: 4,
    statut: 'active',
  },
];

// --- Membres mock par cohorte -------------------------------------------------

export const MOCK_MEMBRES: Record<string, Membre[]> = {
  'coh-003': [
    { id: 'm-001', nom: 'Diallo', prenom: 'Mamadou', email: 'mamadou.diallo@xarala.sn', role: 'etudiant' },
    { id: 'm-002', nom: 'Ndiaye', prenom: 'Fatou', email: 'fatou.ndiaye@xarala.sn', role: 'etudiant' },
    { id: 'm-003', nom: 'Fall', prenom: 'Ibrahima', email: 'ibrahima.fall@xarala.sn', role: 'etudiant' },
    { id: 'm-004', nom: 'Sow', prenom: 'Aminata', email: 'aminata.sow@xarala.sn', role: 'etudiant' },
    { id: 'm-005', nom: 'Mbaye', prenom: 'Omar', email: 'omar.mbaye@xarala.sn', role: 'etudiant' },
    { id: 'm-006', nom: 'Sarr', prenom: 'Rokhaya', email: 'rokhaya.sarr@xarala.sn', role: 'etudiant' },
    { id: 'm-007', nom: 'Kane', prenom: 'Cheikh', email: 'cheikh.kane@xarala.sn', role: 'etudiant' },
    { id: 'm-008', nom: 'Traore', prenom: 'Mariam', email: 'mariam.traore@xarala.sn', role: 'mentor' },
    { id: 'm-009', nom: 'Ba', prenom: 'Moussa', email: 'moussa.ba@xarala.sn', role: 'etudiant' },
    { id: 'm-010', nom: 'Camara', prenom: 'Khadija', email: 'khadija.camara@xarala.sn', role: 'etudiant' },
  ],
  'coh-004': [
    { id: 'm-011', nom: 'Toure', prenom: 'Seydou', email: 'seydou.toure@xarala.sn', role: 'etudiant' },
    { id: 'm-012', nom: 'Konate', prenom: 'Awa', email: 'awa.konate@xarala.sn', role: 'etudiant' },
    { id: 'm-013', nom: 'Kouyate', prenom: 'Babacar', email: 'babacar.kouyate@xarala.sn', role: 'etudiant' },
    { id: 'm-014', nom: 'Dembele', prenom: 'Ndeye', email: 'ndeye.dembele@xarala.sn', role: 'mentor' },
    { id: 'm-015', nom: 'Gueye', prenom: 'Pape', email: 'pape.gueye@xarala.sn', role: 'etudiant' },
  ],
  'coh-005': [
    { id: 'm-016', nom: 'Diop', prenom: 'Saliou', email: 'saliou.diop@xarala.sn', role: 'etudiant' },
    { id: 'm-017', nom: 'Mendy', prenom: 'Rosalie', email: 'rosalie.mendy@xarala.sn', role: 'etudiant' },
    { id: 'm-018', nom: 'Faye', prenom: 'Landing', email: 'landing.faye@xarala.sn', role: 'mentor' },
    { id: 'm-019', nom: 'Badji', prenom: 'Valentin', email: 'valentin.badji@xarala.sn', role: 'etudiant' },
  ],
};

// --- Projets mock par cohorte -------------------------------------------------

export const MOCK_PROJETS: Record<string, Projet[]> = {
  'coh-003': [
    {
      id: 'p-001',
      nom: 'Plateforme E-commerce Senegalaise',
      description: 'Marketplace en ligne pour artisans locaux',
      etat_avancement: 85,
      statut: 'en_cours',
      date_debut: '2025-01-20',
      date_fin_prevue: '2025-06-15',
      nb_membres: 4,
    },
    {
      id: 'p-002',
      nom: 'App de Gestion Scolaire',
      description: 'Systeme de gestion des notes et absences',
      etat_avancement: 100,
      statut: 'termine',
      date_debut: '2025-01-20',
      date_fin_prevue: '2025-04-30',
      nb_membres: 3,
    },
    {
      id: 'p-003',
      nom: 'Dashboard Analytics RH',
      description: 'Tableau de bord pour la gestion des ressources humaines',
      etat_avancement: 60,
      statut: 'en_cours',
      date_debut: '2025-02-01',
      date_fin_prevue: '2025-06-30',
      nb_membres: 4,
    },
    {
      id: 'p-004',
      nom: 'API REST Bibliotheque',
      description: 'Backend complet avec authentication JWT',
      etat_avancement: 100,
      statut: 'termine',
      date_debut: '2025-01-25',
      date_fin_prevue: '2025-03-31',
      nb_membres: 3,
    },
    {
      id: 'p-005',
      nom: 'Application Mobile Sante',
      description: 'Suivi medical pour patients chroniques',
      etat_avancement: 40,
      statut: 'en_cours',
      date_debut: '2025-03-01',
      date_fin_prevue: '2025-06-30',
      nb_membres: 5,
    },
    {
      id: 'p-006',
      nom: 'Chatbot IA Support Client',
      description: 'Bot conversationnel avec integration LLM',
      etat_avancement: 20,
      statut: 'en_attente',
      date_debut: '2025-04-01',
      date_fin_prevue: '2025-06-30',
      nb_membres: 4,
    },
    {
      id: 'p-007',
      nom: 'Systeme de Paiement Mobile',
      description: 'Integration Wave et Orange Money',
      etat_avancement: 0,
      statut: 'en_attente',
      date_debut: '2025-05-01',
      date_fin_prevue: '2025-06-30',
      nb_membres: 5,
    },
  ],
  'coh-004': [
    {
      id: 'p-008',
      nom: 'Reseau Social Academique',
      description: 'Plateforme de mise en reseau pour etudiants',
      etat_avancement: 70,
      statut: 'en_cours',
      date_debut: '2025-02-10',
      date_fin_prevue: '2025-07-15',
      nb_membres: 5,
    },
    {
      id: 'p-009',
      nom: 'Outil de Veille Technologique',
      description: 'Agregateur d\'articles tech avec IA',
      etat_avancement: 50,
      statut: 'en_cours',
      date_debut: '2025-02-15',
      date_fin_prevue: '2025-07-31',
      nb_membres: 4,
    },
    {
      id: 'p-010',
      nom: 'Plateforme de Cours en Ligne',
      description: 'LMS leger avec videos et quiz',
      etat_avancement: 30,
      statut: 'en_cours',
      date_debut: '2025-03-01',
      date_fin_prevue: '2025-07-31',
      nb_membres: 6,
    },
    {
      id: 'p-011',
      nom: 'Gestionnaire de Budget Personnel',
      description: 'Application de suivi des depenses',
      etat_avancement: 100,
      statut: 'termine',
      date_debut: '2025-02-10',
      date_fin_prevue: '2025-04-30',
      nb_membres: 3,
    },
    {
      id: 'p-012',
      nom: 'Systeme de Reservation Restaurant',
      description: 'Booking en temps reel avec notifications',
      etat_avancement: 15,
      statut: 'en_cours',
      date_debut: '2025-04-01',
      date_fin_prevue: '2025-07-31',
      nb_membres: 4,
    },
  ],
  'coh-005': [
    {
      id: 'p-013',
      nom: 'Analyse Donnees Agricoles',
      description: 'Dashboard ML pour optimisation des recoltes',
      etat_avancement: 25,
      statut: 'en_cours',
      date_debut: '2025-06-10',
      date_fin_prevue: '2025-11-15',
      nb_membres: 4,
    },
    {
      id: 'p-014',
      nom: 'Prediction Meteo IA',
      description: 'Modele ML de previsions meteorologiques locales',
      etat_avancement: 10,
      statut: 'en_cours',
      date_debut: '2025-06-15',
      date_fin_prevue: '2025-11-30',
      nb_membres: 5,
    },
    {
      id: 'p-015',
      nom: 'NLP Wolof',
      description: 'Traitement du langage naturel pour le Wolof',
      etat_avancement: 5,
      statut: 'en_attente',
      date_debut: '2025-07-01',
      date_fin_prevue: '2025-11-30',
      nb_membres: 3,
    },
    {
      id: 'p-016',
      nom: 'Detection Fraude Bancaire',
      description: 'Modele de detection d\'anomalies transactionnelles',
      etat_avancement: 0,
      statut: 'en_attente',
      date_debut: '2025-08-01',
      date_fin_prevue: '2025-11-30',
      nb_membres: 6,
    },
  ],
};

// --- Utilitaires mock ---------------------------------------------------------

/**
 * Simule un delai reseau pour les mocks.
 * @param ms - Delai en millisecondes (defaut: 400ms)
 */
export const simulateDelay = (ms = 400): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simule une erreur reseau aleatoire (10% de chance).
 * Utile pour tester les etats d'erreur.
 */
export const simulateRandomError = (): void => {
  if (Math.random() < 0.1) {
    throw new Error('Erreur reseau simulee');
  }
};
