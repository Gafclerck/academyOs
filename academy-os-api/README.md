# Academy OS API — Référence Backend & Matrice de Permissions

API REST Django du projet **Academy OS** servant de socle applicatif pour la gestion des formations, programmes, cohortes, projets, évaluations, certificats, réclamations et notifications.

Ce document constitue la **source unique de vérité** pour l'équipe Frontend.

---

## Sommaire

1. [Stack Technique & Architecture](#1-stack-technique--architecture)
2. [Guide d'Intégration & Conventions Frontend](#2-guide-dintégration--conventions-frontend)
3. [Matrice Globale des Permissions RBAC](#3-matrice-globale-des-permissions-rbac)
4. [Référence Détaillée des Endpoints par Module](#4-référence-détaillée-des-endpoints-par-module)
   - [4.1 Authentification & Profils (`/api/v1/auth/`)](#41-authentification--profils-apiv1auth)
   - [4.2 Administration des Utilisateurs (`/api/v1/users/`)](#42-administration-des-utilisateurs-apiv1users)
   - [4.3 Catalogue des Programmes (`/api/v1/programs/`)](#43-catalogue-des-programmes-apiv1programs)
   - [4.4 Sessions (Intakes), Cohortes & Membres (`/api/v1/intakes/`, `/api/v1/cohorts/`)](#44-sessions-intakes-cohortes--membres-apiv1intakes-apiv1cohorts)
   - [4.5 Projets Pédagogiques & Pièces Jointes (`/api/v1/projects/`)](#45-projets-pédagogiques--pièces-jointes-apiv1projects)
   - [4.6 Évaluations, Critères, Assignations & Livrables (`/api/v1/criteria/`, `/api/v1/assignments/`, `/api/v1/deliverables/`)](#46-évaluations-critères-assignations--livrables)
   - [4.7 Tableaux de Bord & Statistiques Métriques (`/api/v1/dashboard/`, `/stats/`)](#47-tableaux-de-bord--statistiques-métriques)
   - [4.8 Certificats de Fin de Formation (`/api/v1/certificates/`)](#48-certificats-de-fin-de-formation-apiv1certificates)
   - [4.9 Réclamations de Certificats (`/api/v1/claims/`)](#49-réclamations-de-certificats-apiv1claims)
   - [4.10 Notifications Utilisateurs (`/api/v1/notifications/`)](#410-notifications-utilisateurs-apiv1notifications)
   - [4.11 Pièces Jointes Autonomes (`/api/v1/attachments/`)](#411-pièces-jointes-autonomes-apiv1attachments)
5. [Démarrage & Environnement](#5-démarrage--environnement)

---

## 1. Stack Technique & Architecture

- **Framework** : Django 5.2 & Django REST Framework 3.17
- **Authentification** : JWT via `djangorestframework-simplejwt` (rotation des refresh tokens + blacklist)
- **Documentation OpenAPI** : `drf-spectacular` (Swagger disponible sur `/api/docs/`, Redoc sur `/api/redoc/`)
- **Base de données** : PostgreSQL (production/dev Docker) ou SQLite (fallback dev local)
- **Tâches asynchrones** : Celery & Redis (envoi d'emails, génération de certificats)
- **Stockage de fichiers** : Stockage local ou S3-compatible (Cloudflare R2, AWS S3) avec URLs signées temporaires

### Organisation des Applications (`apps/`)

| Entité / Modèle | Application | Rôle & Responsabilité |
|---|---|---|
| `User`, `PasswordResetToken` | `apps.users` | Utilisateur personnalisé, rôles RBAC, flux d'authentification et invitations. |
| `Program` | `apps.programs` | Catalogue des programmes de formation (ex: Dév Web, Data). |
| `Intake`, `Cohort`, `Enrollment`, `TrainerAssignment` | `apps.cohorts` | Périodes globales, cohortes, inscriptions apprenants et affectations formateurs/mentors. |
| `Project` | `apps.projects` | Projets ordonnés au sein d'un programme avec ressources associées. |
| `EvaluationCriterion`, `ProjectAssignment`, `Deliverable`, `CriterionScore` | `apps.evaluations` | Moteur pédagogique : assignations, soumissions de livrables versionnés, corrections et grilles de compétences. |
| `Certificate` | `apps.certificates` | Certificats de complétion, génération automatique/manuelle et vérification publique. |
| `Claim` | `apps.claims` | Gestion des réclamations de certificats par les apprenants. |
| `Notification` | `apps.notifications` | Notifications internes temps-réel / in-app par utilisateur. |
| `Attachment` | `apps.attachments` | Fichiers joints polymorphiques (`GenericRelation`) avec suppression en cascade. |
| `CourseSession`, `Absence` | `apps.pedagogy` | *(Coquille)* Sessions de cours et présences (prévu phase ultérieure). |

---

## 2. Guide d'Intégration & Conventions Frontend

### 2.1 Base URL & En-têtes
- **Base URL API** : `http://localhost:8000/api/v1` (toutes les routes métier sont préfixées par `/api/v1/`).
- **En-tête d'Authentification** : Pour tous les endpoints protégés, envoyer le token JWT d'accès dans le header :
  ```http
  Authorization: Bearer <access_token>
  ```
- **Type de Contenu (`Content-Type`)** :
  - `application/json` pour toutes les requêtes standards.
  - `multipart/form-data` exclusivement pour les routes d'upload de fichiers (ex: soumission de livrable, upload de pièces jointes).

### 2.2 Format Standard de Pagination
Toutes les routes de liste (`GET` sur collections) renvoient une structure paginée standard :
```json
{
  "count": 54,
  "next": "http://localhost:8000/api/v1/projects/?page=3",
  "previous": "http://localhost:8000/api/v1/projects/?page=1",
  "results": [ ... ]
}
```
- **Paramètres de pagination** : `?page=1` et `?page_size=20` (taille par défaut : 20, max autorisé : 100).
- ⚠️ L'application frontend doit toujours extraire le tableau depuis `response.data.results`.

### 2.3 Quotas de Limitation de Débit (Throttling)
En cas de dépassement, l'API renvoie un statut `429 Too Many Requests`.

| Scope / Contexte | Quota appliqué | Cible / Endpoints |
|---|---|---|
| **`anon`** | 100 requêtes / jour | Utilisateurs non authentifiés (global) |
| **`user`** | 1000 requêtes / jour | Utilisateurs authentifiés (global) |
| **`login`** | 5 requêtes / minute | `POST /api/v1/auth/login/` |
| **`invite`** | 10 requêtes / heure | `POST /api/v1/auth/invite/` |
| **`enroll`** | 60 requêtes / heure | `POST .../enrollments/` & `POST .../trainer-assignments/` |
| **`forgot`** | 5 requêtes / heure | `POST /api/v1/auth/forgot-password/` |
| **`reset`** | 5 requêtes / heure | `POST /api/v1/auth/reset-password/` |
| **`activate`** | 5 requêtes / heure | `POST /api/v1/auth/activate/` |

### 2.4 Statuts HTTP & Gestion des Erreurs
- `200 OK` / `201 Created` / `204 No Content` / `205 Reset Content` (déconnexion)
- `400 Bad Request` : Erreur de validation de formulaire ou de payload (`{ "champ": ["Message d'erreur"] }` ou `{ "detail": "..." }`).
- `401 Unauthorized` : Token manquant, expiré ou invalide.
- `403 Forbidden` : Rôle insuffisant ou objet non accessible.
- `404 Not Found` : Ressource introuvable.
- `429 Too Many Requests` : Quota de débit dépassé.

---

## 3. Matrice Globale des Permissions RBAC

Légende des rôles :
- 🌐 **Public** : Accessible sans authentification
- 🎓 **Learner** : Apprenant
- 🧑‍🏫 **Trainer** : Formateur / Mentor
- 📋 **Organizer** : Organisateur pédagogique
- 👑 **Admin** : Administrateur système

Légende des accès :
- ✅ **Complet** : Accès total sans restriction
- 🔍 **Filtré** : Accès restreint au périmètre de l'utilisateur (ses cohortes, ses assignations, ses livrables, ses réclamations)
- ❌ **Interdit** : Renvoie `403 Forbidden` ou `401 Unauthorized`

| Domaine | Méthode | Endpoint | Public | Learner | Trainer | Organizer | Admin | Throttling | Restrictions & Règles Métier |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Auth** | `POST` | `/api/v1/auth/login/` | ✅ | ✅ | ✅ | ✅ | ✅ | `login` (5/m) | Reçoit `{ access, refresh }` |
| | `POST` | `/api/v1/auth/token/refresh/` | ✅ | ✅ | ✅ | ✅ | ✅ | — | Rafraîchissement avec rotation |
| | `GET` | `/api/v1/auth/me/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Profil de l'utilisateur connecté |
| | `PATCH` | `/api/v1/auth/me/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Modifier prénom, nom, téléphone |
| | `POST` | `/api/v1/auth/change-password/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Changement de mot de passe connecté |
| | `POST` | `/api/v1/auth/logout/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Blackliste le refresh token |
| | `POST` | `/api/v1/auth/invite/` | ❌ | ❌ | ❌ | ✅ | ✅ | `invite` (10/h) | Inviter formateur/apprenant (unitaire ou lot) |
| | `POST` | `/api/v1/auth/forgot-password/` | ✅ | ✅ | ✅ | ✅ | ✅ | `forgot` (5/h) | Envoi code OTP (anti-énumération) |
| | `POST` | `/api/v1/auth/reset-password/` | ✅ | ✅ | ✅ | ✅ | ✅ | `reset` (5/h) | Définir mot de passe (compte `active`) |
| | `POST` | `/api/v1/auth/activate/` | ✅ | ✅ | ✅ | ✅ | ✅ | `activate` (5/h) | Définir mot de passe + profil (compte `pending`) |
| **Users** | `GET` | `/api/v1/users/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Liste paginée avec filtres `role`, `status`, `search` |
| | `POST` | `/api/v1/users/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Création directe d'utilisateur avec rôle |
| | `GET` | `/api/v1/users/<id>/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Détail d'un compte utilisateur |
| | `PATCH` | `/api/v1/users/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Suspension, réactivation, changement de rôle |
| | `DELETE` | `/api/v1/users/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Supprimer un compte (interdit sur soi-même) |
| **Programmes** | `GET` | `/api/v1/programs/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Filtré : programmes de ses cohortes actives |
| | `POST` | `/api/v1/programs/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Création d'un programme |
| | `GET` | `/api/v1/programs/<id>/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Détail d'un programme accessible |
| | `PATCH` | `/api/v1/programs/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Modifier un programme |
| | `DELETE` | `/api/v1/programs/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Supprimer un programme |
| | `GET` | `/api/v1/programs/<id>/stats/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Synthèse multi-cohortes du programme |
| **Intakes** | `GET` | `/api/v1/intakes/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Filtré : rentrées des cohortes où l'utilisateur est inscrit/affecté |
| | `POST` | `/api/v1/intakes/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Créer une session institutionnelle |
| | `GET` | `/api/v1/intakes/<id>/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Détail d'une session autorisée |
| | `PATCH` | `/api/v1/intakes/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Modifier une session |
| | `DELETE` | `/api/v1/intakes/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Supprimer une session |
| **Cohortes** | `GET` | `/api/v1/cohorts/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Filtré : cohortes où l'utilisateur est inscrit/affecté |
| | `POST` | `/api/v1/cohorts/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Créer une cohorte |
| | `GET` | `/api/v1/cohorts/<id>/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Détail d'une cohorte autorisée |
| | `PATCH` | `/api/v1/cohorts/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Modifier une cohorte |
| | `DELETE` | `/api/v1/cohorts/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Supprimer une cohorte |
| | `GET` | `/api/v1/cohorts/<id>/enrollments/` | ❌ | ❌ | 🔍 | ✅ | ✅ | — | Formateurs : uniquement pour leurs cohortes |
| | `POST` | `/api/v1/cohorts/<id>/enrollments/` | ❌ | ❌ | ❌ | ✅ | ✅ | `enroll` (60/h) | Inscrire des apprenants `{emails:[...]}` + auto-assignation |
| | `GET` | `/api/v1/cohorts/<id>/trainer-assignments/`| ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Apprenants/Formateurs de la cohorte |
| | `POST` | `/api/v1/cohorts/<id>/trainer-assignments/`| ❌ | ❌ | ❌ | ✅ | ✅ | `enroll` (60/h) | Affecter des formateurs `{emails:[...]}` |
| | `PATCH` | `/api/v1/cohorts/<c_id>/enrollments/<e_id>/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Assigner/retirer un mentor `{mentor: uuid\|null}` |
| **Projets** | `GET` | `/api/v1/projects/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Filtré : projets des programmes de ses cohortes |
| | `POST` | `/api/v1/projects/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Créer un projet (support upload direct `files`) |
| | `GET` | `/api/v1/projects/<id>/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Détail avec pièces jointes associées |
| | `PATCH` | `/api/v1/projects/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Modifier un projet |
| | `DELETE` | `/api/v1/projects/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Suppression en cascade (critères, livrables, fichiers) |
| | `GET` | `/api/v1/projects/<id>/attachments/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Liste des pièces jointes du projet |
| | `POST` | `/api/v1/projects/<id>/attachments/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Téléverser une ressource sur un projet |
| | `DELETE`| `/api/v1/projects/<p_id>/attachments/<a_id>/`| ❌ | ❌ | ❌ | ❌ | ✅ | — | Supprimer une pièce jointe de projet |
| **Évaluations**| `GET` | `/api/v1/criteria/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Liste paginée des critères par projet |
| | `POST` | `/api/v1/criteria/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Créer un critère d'évaluation pondéré |
| | `GET` | `/api/v1/criteria/<id>/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Détail d'un critère |
| | `PATCH` | `/api/v1/criteria/<id>/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Modifier un critère |
| | `DELETE` | `/api/v1/criteria/<id>/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Supprimer un critère |
| | `GET` | `/api/v1/assignments/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Filtré : apprenant = ses assignations, formateur = ses cohortes |
| | `POST` | `/api/v1/assignments/` | ❌ | ❌ | ✅ | ✅ | ✅ | — | Création manuelle d'une assignation |
| | `GET` | `/api/v1/assignments/<id>/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Détail de l'assignation avec statut et note |
| | `PATCH` | `/api/v1/assignments/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Modifier deadline / statut d'assignation |
| | `DELETE` | `/api/v1/assignments/<id>/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Supprimer une assignation |
| | `GET` | `/api/v1/deliverables/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | File globale de correction (formateur) ou historique |
| | `GET` | `/api/v1/assignments/<id>/deliverables/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Historique des versions (v1, v2...) d'une assignation |
| | `POST` | `/api/v1/assignments/<id>/deliverables/submit/` | ❌ | 🔍 | ❌ | ❌ | ❌ | — | **Soumettre un livrable** (uniquement apprenant assigné) |
| | `GET` | `/api/v1/deliverables/<id>/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Détail d'un livrable, fichiers et notes critériées |
| | `POST` | `/api/v1/deliverables/<id>/review/` | ❌ | ❌ | 🔍 | ✅ | ✅ | — | **Noter un livrable** (formateur de la cohorte ou admin) |
| **Dashboards**| `GET` | `/api/v1/dashboard/stats/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Indicateurs globaux et KPIs plateforme |
| | `GET` | `/api/v1/dashboard/trainer/` | ❌ | ❌ | 🔍 | ✅ | ✅ | — | Formateur connecté (ou `?trainer=<uuid>` pour admin/orga) |
| | `GET` | `/api/v1/dashboard/learner/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Synthèse progression apprenant connecté (`?cohort=`) |
| | `GET` | `/api/v1/cohorts/<id>/stats/` | ❌ | ❌ | 🔍 | ✅ | ✅ | — | Taux de complétion et stats par compétence |
| | `GET` | `/api/v1/enrollments/<id>/progress/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Fiche détaillée apprenant (progression, risque) |
| **Certificats**| `GET` | `/api/v1/certificates/me/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Liste des certificats de l'utilisateur connecté |
| | `GET` | `/api/v1/certificates/<id>/` | ✅ | ✅ | ✅ | ✅ | ✅ | — | Vérification publique (certificats `SENT` uniquement) |
| | `POST` | `/api/v1/certificates/generate/` | ❌ | ❌ | ❌ | ❌ | ✅ | — | Déclenchement manuel génération certificat |
| **Claims** | `GET` | `/api/v1/claims/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Apprenant = ses réclamations ; Formateur = ses cohortes |
| | `POST` | `/api/v1/claims/` | ❌ | ✅ | ❌ | ❌ | ❌ | — | Réclamer un certificat (apprenant uniquement) |
| | `GET` | `/api/v1/claims/<id>/` | ❌ | 🔍 | 🔍 | ✅ | ✅ | — | Détail d'une réclamation autorisée |
| | `PATCH` | `/api/v1/claims/<id>/` | ❌ | ❌ | ❌ | ✅ | ✅ | — | Traiter et répondre à une réclamation |
| | `DELETE` | `/api/v1/claims/<id>/` | ❌ | 🔍 | ❌ | ✅ | ✅ | — | Apprenant uniquement si statut `PENDING` |
| **Notifs** | `GET` | `/api/v1/notifications/` | ❌ | 🔍 | 🔍 | 🔍 | 🔍 | — | Notifications personnelles de l'utilisateur connecté |
| | `GET` | `/api/v1/notifications/<id>/` | ❌ | 🔍 | 🔍 | 🔍 | 🔍 | — | Détail d'une notification personnelle |
| | `GET` | `/api/v1/notifications/unread-count/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Nombre de notifications non lues |
| | `PATCH` | `/api/v1/notifications/<id>/read/` | ❌ | 🔍 | 🔍 | 🔍 | 🔍 | — | Marquer une notification comme lue |
| | `POST` | `/api/v1/notifications/read-all/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Tout marquer comme lu |
| **Fichiers** | `POST` | `/api/v1/attachments/` | ❌ | ✅ | ✅ | ✅ | ✅ | — | Upload autonome multipart (max 10 Mo) |
| | `GET` | `/api/v1/attachments/<id>/` | ❌ | 🔍 | 🔍 | 🔍 | ✅ | — | Auteur de l'upload ou administrateur |
| | `DELETE` | `/api/v1/attachments/<id>/` | ❌ | 🔍 | ❌ | ❌ | ✅ | — | Auteur de l'upload ou administrateur |

---

## 4. Référence Détaillée des Endpoints par Module

### 4.1 Authentification & Profils (`/api/v1/auth/`)

| Méthode | Route | Permission / Throttle | Corps de Requête (JSON) | Réponse |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login/` | `AllowAny` (`5/min`) | `{"email": "...", "password": "..."}` | `200 OK` `{ "access": "...", "refresh": "..." }` |
| `POST` | `/api/v1/auth/token/refresh/` | `AllowAny` | `{"refresh": "..."}` | `200 OK` `{ "access": "...", "refresh": "..." }` |
| `GET` | `/api/v1/auth/me/` | Authentifié | — | `200 OK` Profil complet de l'utilisateur |
| `PATCH` | `/api/v1/auth/me/` | Authentifié | `{"first_name": "...", "last_name": "...", "phone_number": "..."}` | `200 OK` Profil mis à jour |
| `POST` | `/api/v1/auth/change-password/`| Authentifié | `{"current_password": "...", "new_password": "..."}` | `200 OK` `{ "detail": "Mot de passe mis à jour." }` |
| `POST` | `/api/v1/auth/logout/` | Authentifié | `{"refresh": "..."}` | `205 Reset Content` (token révoqué) |
| `POST` | `/api/v1/auth/invite/` | Admin / Organizer (`10/h`) | Unitaire : `{"email": "...", "role": "trainer"\|"learner"}`<br>Lot : `{"emails": [...], "role": "..."}` | `201 Created` `{ "results": [{ "email", "status", "detail" }] }` |
| `POST` | `/api/v1/auth/forgot-password/`| `AllowAny` (`5/h`) | `{"email": "..."}` | `200 OK` Message générique anti-énumération |
| `POST` | `/api/v1/auth/reset-password/` | `AllowAny` (`5/h`) | `{"email": "...", "code": "...", "new_password": "..."}` | `200 OK` `{ "detail": "Mot de passe réinitialisé." }` |
| `POST` | `/api/v1/auth/activate/` | `AllowAny` (`5/h`) | `{"email", "code", "new_password", "first_name", "last_name", "phone_number"}` | `200 OK` `{ "detail": "Compte activé avec succès." }` |

---

### 4.2 Administration des Utilisateurs (`/api/v1/users/`)

| Méthode | Route | Permissions | Filtres / Query Params | Corps de Requête |
|---|---|---|---|---|
| `GET` | `/api/v1/users/` | Admin / Organizer | `?role=`, `?status=`, `?is_active=`, `?search=`, `?page=`, `?page_size=` | — |
| `POST` | `/api/v1/users/` | Admin | — | `{"email", "role", "first_name"?, "last_name"?, "phone_number"?}` |
| `GET` | `/api/v1/users/<id>/` | Admin / Organizer | — | — |
| `PATCH` | `/api/v1/users/<id>/` | Admin | — | `{"status", "role", "first_name", "last_name", "phone_number"}` |
| `DELETE` | `/api/v1/users/<id>/` | Admin | — | *(Suppression interdite sur son propre compte)* |

#### Cycle de vie des statuts de compte (`status`) :
- `pending` : Compte invité pré-créé, en attente d'activation (`is_active = False`).
- `active` : Compte validé et opérationnel pouvant s'authentifier (`is_active = True`).
- `suspended` : Compte temporairement suspendu par un admin (`is_active = False`).
- `archived` : Compte désactivé définitivement (`is_active = False`).

---

### 4.3 Catalogue des Programmes (`/api/v1/programs/`)

| Méthode | Route | Permissions | Description & Filtres |
|---|---|---|---|
| `GET` | `/api/v1/programs/` | Authentifié (filtré selon rôle) | Liste paginée. Admin/Organizer : tous ; Formateur/Apprenant : leurs cohortes |
| `POST` | `/api/v1/programs/` | Admin | `{"title": "...", "description": "..."}` |
| `GET` | `/api/v1/programs/<id>/` | Authentifié (filtré) | Détail d'un programme |
| `PATCH` | `/api/v1/programs/<id>/` | Admin | Modifier titre / description |
| `DELETE` | `/api/v1/programs/<id>/` | Admin | Supprimer un programme |
| `GET` | `/api/v1/programs/<id>/stats/` | Admin / Organizer | Synthèse globale multi-cohortes du programme (taux de complétion, validation) |

---

### 4.4 Sessions (Intakes), Cohortes & Membres (`/api/v1/intakes/`, `/api/v1/cohorts/`)

| Méthode | Route | Permissions | Corps / Filtres | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/intakes/` | Authentifié (filtré selon rôle) | Paginé | Liste des rentrées (Admin/Orga : toutes ; Formateur/Apprenant : leurs cohortes) |
| `POST` | `/api/v1/intakes/` | Admin | `{"name", "start_date", "status"}` | Créer une session (`draft`, `active`, `completed`, `archived`) |
| `GET` | `/api/v1/intakes/<id>/` | Authentifié (filtré) | — | Détail d'une session autorisée |
| `PATCH` / `DELETE` | `/api/v1/intakes/<id>/` | Admin | — | Modification / Suppression d'une session |
| `GET` | `/api/v1/cohorts/` | Authentifié (filtré) | `?intake=<uuid>`, `?program=<uuid>` | Liste des cohortes (filtrée selon affectation/inscription) |
| `POST` | `/api/v1/cohorts/` | Admin | `{"name", "program", "intake", "status", "start_date", "end_date"}` | Créer une cohorte rattachée |
| `GET` / `PATCH` / `DELETE` | `/api/v1/cohorts/<id>/` | GET : Authentifié / Écriture : Admin | — | Détail / Modification / Suppression |
| `GET` | `/api/v1/cohorts/<id>/enrollments/` | Admin, Organizer, Formateur cohorte | Paginé | Liste des apprenants inscrits dans la cohorte |
| `POST` | `/api/v1/cohorts/<id>/enrollments/` | Admin, Organizer (`enroll` 60/h) | `{"emails": ["a@b.com", ...]}` | Inscrire des apprenants + **auto-assignation automatique des projets** |
| `GET` | `/api/v1/cohorts/<id>/trainer-assignments/` | Membres cohorte, Admin, Organizer | Paginé | Liste des formateurs affectés à la cohorte |
| `POST` | `/api/v1/cohorts/<id>/trainer-assignments/` | Admin, Organizer (`enroll` 60/h) | `{"emails": ["f@b.com", ...]}` | Affecter des formateurs à la cohorte |
| `PATCH` | `/api/v1/cohorts/<c_id>/enrollments/<e_id>/` | Admin, Organizer | `{"mentor": "<uuid>" \| null}` | Assigner ou retirer le mentor de l'apprenant (doit être formateur de la cohorte) |

---

### 4.5 Projets Pédagogiques & Pièces Jointes (`/api/v1/projects/`)

| Méthode | Route | Permissions | Format | Description & Payload |
|---|---|---|---|---|
| `GET` | `/api/v1/projects/` | Authentifié (filtré) | JSON | `?program=<uuid>`, `?status=draft\|published`, `?search=` |
| `POST` | `/api/v1/projects/` | Admin | JSON ou Multipart | `{"program", "title", "description", "order", "status", "deadline_days", "files": [...]}`. Si `published`, auto-assigne aux cohortes en cours |
| `GET` | `/api/v1/projects/<id>/` | Authentifié (filtré) | JSON | Détail du projet et liste de ses pièces jointes |
| `PATCH` | `/api/v1/projects/<id>/` | Admin | JSON | Modifier projet. Le passage à `published` déclenche l'auto-assignation |
| `DELETE` | `/api/v1/projects/<id>/` | Admin | — | Supprime en cascade critères, assignations et fichiers joints |
| `GET` | `/api/v1/projects/<id>/attachments/` | Authentifié | JSON | Liste de tous les fichiers rattachés au projet |
| `POST` | `/api/v1/projects/<id>/attachments/` | Admin | `multipart/form-data` | Champ `file` (max 10 Mo) : téléverser une pièce jointe |
| `DELETE` | `/api/v1/projects/<p_id>/attachments/<a_id>/` | Admin | — | Supprime définitivement la pièce jointe du projet |

---

### 4.6 Évaluations, Critères, Assignations & Livrables

#### Flow Métier :
```text
1. Publication du projet ──► Auto-assignation aux cohortes actives
   - Projet 1 (order 1)  ──► Statut : IN_PROGRESS (débloqué)
   - Projets suivants    ──► Statut : PENDING (verrouillés)

2. Soumission (Apprenant) ──► POST /api/v1/assignments/<id>/deliverables/submit/
   - Envoi de liens (GitHub, Démo) et pièces jointes multipart.
   - Création de la version vN et passage de l'assignation en SUBMITTED.

3. Correction (Formateur) ──► POST /api/v1/deliverables/<id>/review/
   - Si REJETÉ  ──► Livrable REJECTED, assignation repasse en IN_PROGRESS (permet v2).
   - Si VALIDÉ  ──► Livrable VALIDATED, déblocage automatique du projet suivant (PENDING ──► IN_PROGRESS).
   - Si Dernier Projet validé ──► Inscription COMPLETED + Certificat initialisé (EN_ATTENTE).
```

#### Endpoints du module Évaluations :

| Domaine | Méthode | Endpoint | Permissions | Corps / Paramètres | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Critères** | `GET` | `/api/v1/criteria/` | Authentifié | `?project=<uuid>`, `?competency_name=` | Liste des critères d'évaluation |
| | `POST` | `/api/v1/criteria/` | Admin / Organizer | `{"project", "title", "competency_name", "max_score": 20, "weight": 1.0, "order": 1}` | Créer un critère d'évaluation |
| | `GET` / `PATCH` / `DELETE` | `/api/v1/criteria/<id>/` | GET : Authentifié / Écriture : Admin, Organizer | — | Détail / Modifier / Supprimer un critère |
| **Assignations** | `GET` | `/api/v1/assignments/` | Authentifié (filtré) | `?cohort=`, `?project=`, `?user=`, `?status=pending\|in_progress\|submitted\|validated` | Liste paginée des assignations |
| | `POST` | `/api/v1/assignments/` | Admin, Organizer, Formateur | `{"enrollment": "<uuid>", "project": "<uuid>", "deadline_override"?: "..."}` | Création manuelle d'une assignation |
| | `GET` | `/api/v1/assignments/<id>/` | Authentifié (filtré) | — | Détail avec historique des livrables et note finale |
| | `PATCH` / `DELETE` | `/api/v1/assignments/<id>/` | Admin | `{"status"?, "deadline_override"?, "final_score"?}` | Modification manuelle / Suppression |
| **Livrables** | `GET` | `/api/v1/deliverables/` | Authentifié (filtré) | `?status=`, `?cohort=`, `?project=`, `?assignment=`, `?user=` | **File globale de correction** (formateur) ou historique |
| | `GET` | `/api/v1/assignments/<id>/deliverables/` | Membres concernés | — | Liste chronologique et versionnée des livrables d'une assignation |
| | `POST` | `/api/v1/assignments/<id>/deliverables/submit/` | Apprenant assigné | `multipart/form-data` ou JSON : `{"repo_url"?, "live_url"?, "comments"?, "files"?: [...]}` | **Soumettre un livrable** (crée version vN, statut SUBMITTED) |
| | `GET` | `/api/v1/deliverables/<id>/` | Membres concernés | — | Détail complet du livrable avec pièces jointes et grille notée |
| | `POST` | `/api/v1/deliverables/<id>/review/` | Formateur cohorte, Admin | `{"status": "validated"\|"rejected", "score"?: 85, "feedback"?: "...", "criterion_scores"?: [{"criterion_id": "...", "score": 18, "mastery_level": "advanced", "feedback": "..."}]}` | **Corriger et évaluer un livrable** (note directe ou grille critériée) |

---

### 4.7 Tableaux de Bord & Statistiques Métriques

| Méthode | Route | Permissions | Query Params | Contenu & Utilité Frontend |
|---|---|---|---|---|
| `GET` | `/api/v1/dashboard/stats/` | Admin / Organizer | — | **Dashboard Global** : Total apprenants, formateurs, cohortes actives, taux de complétion global, taux de validation, répartition par statut. |
| `GET` | `/api/v1/dashboard/trainer/` | Formateur, Organizer, Admin | `?trainer=<uuid>` *(admin/orga uniquement)* | **Dashboard Formateur** : Total étudiants assignés, mentorés, file des livrables en attente de correction, résumé par cohorte. |
| `GET` | `/api/v1/dashboard/learner/` | Authentifié (Apprenant) | `?cohort=<uuid>` *(optionnel)* | **Dashboard Apprenant** : % d'avancement global, projet actif en cours, mentor assigné, derniers livrables et radar des compétences acquises. |
| `GET` | `/api/v1/cohorts/<id>/stats/` | Admin, Organizer, Formateur cohorte | — | **Statistiques de Cohorte** : Progression moyenne %, taux de validation, indicateurs détaillés par projet, compétences et progression par apprenant. |
| `GET` | `/api/v1/enrollments/<id>/progress/` | Membres concernés | — | **Fiche Apprenant** : Progression individuelle, indicateur d'apprenant à risque (`is_at_risk`), détail de chaque assignation et notes. |

---

### 4.8 Certificats de Fin de Formation (`/api/v1/certificates/`)

| Méthode | Route | Permissions | Format / Payload | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/certificates/me/` | Authentifié | — | Liste de tous les certificats obtenus par l'apprenant connecté. |
| `GET` | `/api/v1/certificates/<id>/` | **Public** (`AllowAny`) | — | **Vérification publique d'authenticité** d'un certificat (uniquement si statut = `SENT`). |
| `POST` | `/api/v1/certificates/generate/`| Admin | `{"enrollment_id": "<uuid>"}` | Déclenchement manuel de génération de certificat et envoi d'email via Celery. |

---

### 4.9 Réclamations de Certificats (`/api/v1/claims/`)

| Méthode | Route | Permissions | Corps / Filtres | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/claims/` | Authentifié (filtré) | `?status=pending\|in_progress\|resolved\|rejected` | Liste paginée (Apprenant : les siennes ; Formateur : ses cohortes ; Admin/Orga : toutes). |
| `POST` | `/api/v1/claims/` | Apprenant uniquement | `{"certificate": "<uuid>", "message": "..."}` | Déposer une réclamation suite à un certificat non reçu ou erroné. |
| `GET` | `/api/v1/claims/<id>/` | Membres autorisés | — | Consulter le détail de la réclamation et la réponse de l'administration. |
| `PATCH` | `/api/v1/claims/<id>/` | Admin / Organizer | `{"status": "in_progress"\|"resolved"\|"rejected", "admin_response": "..."}` | Traiter la réclamation et envoyer une réponse à l'apprenant. |
| `DELETE` | `/api/v1/claims/<id>/` | Admin, Organizer, Apprenant auteur | — | Supprimer la réclamation (Apprenant : uniquement si statut `PENDING`). |

---

### 4.10 Notifications Utilisateurs (`/api/v1/notifications/`)

| Méthode | Route | Permissions | Réponse | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/notifications/` | Authentifié | `{ count, next, previous, results: [...] }` | Liste paginée des notifications in-app de l'utilisateur connecté. |
| `GET` | `/api/v1/notifications/<id>/` | Authentifié (destinataire) | `NotificationSerializer` | Détail d'une notification. |
| `GET` | `/api/v1/notifications/unread-count/`| Authentifié | `{"unread_count": 4}` | Nombre total de notifications non lues (pour pastille / badge UI). |
| `PATCH` | `/api/v1/notifications/<id>/read/` | Authentifié (destinataire) | `NotificationSerializer` | Marquer une notification spécifique comme lue (`is_read = true`). |
| `POST` | `/api/v1/notifications/read-all/` | Authentifié | `{"updated_count": 12}` | Marquer toutes les notifications de l'utilisateur comme lues. |

---

### 4.11 Pièces Jointes Autonomes (`/api/v1/attachments/`)

| Méthode | Route | Permissions | Format | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/attachments/` | Authentifié | `multipart/form-data` | Upload autonome d'un fichier (champ `file`, max 10 Mo). Stocké sous nom UUID sécurisé. |
| `GET` | `/api/v1/attachments/<id>/` | Auteur de l'upload ou Admin | JSON | Détail du fichier avec URL de téléchargement signée et temporaire. |
| `DELETE` | `/api/v1/attachments/<id>/` | Auteur de l'upload ou Admin | — | Suppression physique du fichier et de la référence en base. |

---

## 5. Démarrage & Environnement

### 5.1 Variables d'environnement
- `.env` contient la configuration locale (`DATABASE_URL`, `SECRET_KEY`, `DEBUG`, `EMAIL_*`, `STORAGE_BACKEND`).
- Le template d'exemple est disponible dans `.env.example`.

### 5.2 Lancer le projet en local (PowerShell / Windows)

```powershell
# 1. Créer et activer le venv
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 2. Variables d'environnement
Copy-Item .env.example .env

# 3. Migrations de la base de données
.\.venv\Scripts\python.exe manage.py migrate

# 4. Lancer le serveur de développement
.\.venv\Scripts\python.exe manage.py runserver
```

- **API Root** : `http://127.0.0.1:8000/api/v1/`
- **Swagger Documentation** : `http://127.0.0.1:8000/api/docs/`
- **Redoc Documentation** : `http://127.0.0.1:8000/api/redoc/`

### 5.3 Exécution des Tests

```powershell
# Exécuter l'ensemble de la suite de tests
.\.venv\Scripts\python.exe manage.py test

# Exécuter les tests d'une application spécifique
.\.venv\Scripts\python.exe manage.py test apps.evaluations
.\.venv\Scripts\python.exe manage.py test apps.users
.\.venv\Scripts\python.exe manage.py test apps.cohorts
```

