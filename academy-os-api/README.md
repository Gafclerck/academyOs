# Academy OS API

API REST Django du projet **Academy OS**

## Stack technique

- Django 5.2
- Django REST Framework 3.17
- djangorestframework-simplejwt (authentification par JWT)
- drf-spectacular (documentation OpenAPI / Swagger)
- django-environ (configuration par variables d'environnement, 12-factor)
- Tests : runner natif Django (`django.test.TestCase` / `rest_framework.test.APITestCase`)

## Architecture du projet

```
academy-os-api/
├── manage.py                # outils de développement ; module de settings par défaut
├── config/
│   ├── settings/
│   │   ├── base.py          # configuration commune (apps, DRF, JWT, CORS, base de données)
│   │   ├── development.py   # environnement de développement (DEBUG, CORS ouvert, email console)
│   │   └── production.py    # environnement de production (DEBUG off, HSTS, cookies sécurisés)
│   ├── urls.py              # routage racine /api/v1/
│   ├── wsgi.py              # point d'entrée WSGI ; module de settings par défaut : production
│   └── asgi.py              # point d'entrée ASGI ; module de settings par défaut : production
└── apps/
    ├── core/                # socle partagé : modèles abstraits (`TimeStampedModel`, `UUIDModel`), permissions globales, infra de test (`base.py`/`factories.py`)
    ├── users/               # modèle utilisateur personnalisé, auth, RBAC
    ├── programs/            # catalogue de programmes et projets
    ├── cohorts/             # Intake + Cohort + Inscriptions + Affectations formateurs
    ├── evaluations/         # Assignations, Livrables, Grilles critériées, Corrections, Statistiques/KPIs
    ├── certificates/        # Certificats de complétion (génération et statut)
    ├── pedagogy/            # COQUILLE : CourseSession + Absence (cours)
    └── attachments/         # Attachment (upload de fichiers polymorphiques, stockage local/S3)
```

### Organisation des applications — quoi mettre où

- **Code en anglais** : apps, classes, champs, fichiers, routes, enums. Commentaires et descriptions d'API en français.
- Les applications vivent sous `apps/` avec des chemins d'import dotted (ex. `apps.evaluations`). Toute nouvelle application doit être déclarée dans `LOCAL_APPS` dans `config/settings/base.py`.
- Modèle utilisateur personnalisé : `AUTH_USER_MODEL = 'users.User'`. Les clés étrangères vers un utilisateur doivent référencer `settings.AUTH_USER_MODEL`, jamais le modèle `User` par défaut.
- **Mapping entité → app** :

| Entité | App | Statut | Description |
|---|---|---|---|
| `Program` | `apps.programs` | ✅ Actif | Programme de formation (ex: Dév Web, Data) |
| `Project` | `apps.projects` | ✅ Actif | Projet d'un programme avec ordre séquentiel unique (`order`) |
| `Intake` | `apps.cohorts` | ✅ Actif | Session / période globale institutionnelle (`name`, `start_date`, `status`) |
| `Cohort` | `apps.cohorts` | ✅ Actif | Cohorte rattachée à un `program` et un `intake` |
| `TrainerAssignment` | `apps.cohorts` | ✅ Actif | Formateur affecté à une cohorte |
| `Enrollment` | `apps.cohorts` | ✅ Actif | Apprenant inscrit à une cohorte avec lien `mentor` optionnel |
| `EvaluationCriterion` | `apps.evaluations` | ✅ Actif | Critère d'évaluation / compétence rattaché à un projet (`max_score`, `weight`, `order`) |
| `ProjectAssignment` | `apps.evaluations` | ✅ Actif | Assignation d'un projet à une inscription avec statut et note finale |
| `Deliverable` | `apps.evaluations` | ✅ Actif | Livrable versionné soumis par l'apprenant (liens, pièces jointes, feedbacks) |
| `CriterionScore` | `apps.evaluations` | ✅ Actif | Note détaillée et niveau d'acquisition par compétence sur un livrable |
| `Certificate` | `apps.certificates` | ✅ Actif | Certificat de fin de formation déclenché à la validation du parcours |
| `Attachment` | `apps.attachments` | ✅ Actif | Fichier joint polymorphique (`GenericRelation`) avec suppression en cascade |
| `CourseSession` | `apps.pedagogy` | ⏳ Coquille | Cours dispensé par un formateur à une cohorte |
| `Absence` | `apps.pedagogy` | ⏳ Coquille | Suivi des présences / absences par session pédagogique |

---

## Module Évaluations & Livrables

### 1. Cycle de vie et Flow opérationnel

Le module d'évaluation gère l'intégralité du parcours pratique de l'apprenant, depuis son inscription jusqu'à sa certification :

```text
1. CONFIGURATION (Admin / Formateur)
   └── L'administrateur crée des projets ordonnés (order: 1, 2, 3...) dans un programme
       et définit les critères d'évaluation par projet (EvaluationCriterion).

2. AUTO-ASSIGNATION (Système)
   └── Dès qu'un apprenant est inscrit dans une cohorte (Enrollment), le système crée
       automatiquement une assignation (ProjectAssignment) pour chaque projet publié.
       - Projet 1 (order 1)  ──► Statut : IN_PROGRESS (débloqué)
       - Projets suivants    ──► Statut : PENDING (verrouillés)

3. SOUMISSION (Apprenant)
   └── L'apprenant dépose son travail sur l'assignation débloquée (POST .../submit/).
       - Envoi des liens (dépôt GitHub, démo en ligne) et commentaires.
       - Pièces jointes illimitées (ZIP, PDF, maquettes...) via upload multipart.
       - Création d'un Deliverable versionné (v1) et passage de l'assignation en SUBMITTED.

4. CORRECTION & ÉVALUATION (Formateur / Mentor)
   └── Le formateur affecté à la cohorte évalue le livrable (POST .../review/).
       Deux modes de notation possibles :
       - Mode Grille critériée : saisie des notes et niveaux d'acquisition par compétence
         (CriterionScore) ──► calcul automatique de la moyenne pondérée normalisée.
       - Mode Note directe : saisie directe du score global.

5. DÉCISION & PROGRESSION :
   ├── Si REJETÉ :
   │     - Le livrable passe en REJECTED avec le feedback du formateur.
   │     - L'assignation repasse en IN_PROGRESS : l'étudiant peut soumettre une version v2.
   │
   └── Si VALIDÉ :
         - Le livrable passe en VALIDATED, l'assignation enregistre le final_score.
         - Le projet suivant passe automatiquement de PENDING à IN_PROGRESS.
         - Si c'était le dernier projet du programme : l'inscription passe en COMPLETED
           et un Certificat EN_ATTENTE est automatiquement initialisé.
```

---

### 2. Matching Fonctionnalités $\leftrightarrow$ Endpoints API (Routes Plates `/api/v1/`)

Toutes les routes sont plates et accessibles directement sous `/api/v1/` :

| Domaine | Méthode | Endpoint | Permissions | Description & Filtres |
| :--- | :--- | :--- | :--- | :--- |
| **Critères** | `GET` | `/api/v1/criteria/` | Authentifié | Lister les critères d'évaluation. Filtres : `?project=<uuid>`, `?competency_name=` |
| | `POST` | `/api/v1/criteria/` | Admin / Organizer | Créer un critère d'évaluation (`project, title, competency_name, max_score, weight, order`) |
| | `GET` | `/api/v1/criteria/<id>/` | Authentifié | Détail d'un critère d'évaluation |
| | `PATCH` | `/api/v1/criteria/<id>/` | Admin / Organizer | Modifier un critère d'évaluation |
| | `DELETE` | `/api/v1/criteria/<id>/` | Admin / Organizer | Supprimer un critère d'évaluation |
| **Assignations** | `GET` | `/api/v1/assignments/` | Authentifié (selon rôle) | Liste des assignations de projet. Filtres : `?cohort=`, `?project=`, `?user=`, `?status=` |
| | `POST` | `/api/v1/assignments/` | Admin / Trainer | Création manuelle d'une assignation (`enrollment, project, deadline_override`) |
| | `GET` | `/api/v1/assignments/<id>/` | Authentifié (selon rôle) | Détail d'une assignation avec liste de ses livrables et note finale |
| | `PATCH` | `/api/v1/assignments/<id>/` | Admin | Modifier une assignation (ex: date limite, statut) |
| | `DELETE` | `/api/v1/assignments/<id>/` | Admin | Supprimer une assignation |
| **Livrables** | `GET` | `/api/v1/assignments/<id>/deliverables/` | Authentifié (selon rôle) | Liste chronologique et versionnée des livrables déposés pour une assignation |
| | `POST` | `/api/v1/assignments/<id>/deliverables/submit/` | Apprenant assigné | **Soumettre un livrable** (multipart/form-data ou JSON : `repo_url`, `live_url`, `comments`, `files`) |
| | `GET` | `/api/v1/deliverables/<id>/` | Authentifié (selon rôle) | Détail complet d'un livrable avec ses pièces jointes et sa grille de notes détaillée |
| | `POST` | `/api/v1/deliverables/<id>/review/` | Formateur cohorte / Admin | **Corriger un livrable** (`status: "validated"\|"rejected"`, `score`, `feedback`, `criterion_scores: [...]`) |
| **Statistiques** | `GET` | `/api/v1/cohorts/<id>/stats/` | Formateur cohorte / Admin | Statistiques de cohorte (progression moyenne %, taux de validation, stats par compétence et par apprenant) |
| | `GET` | `/api/v1/dashboard/stats/` | Admin / Organizer | Tableau de bord global (utilisateurs, cohortes, projets, taux de complétion académie, distributions) |

---

## Administration des Utilisateurs & Membres

### Endpoints d'administration des utilisateurs (`/api/v1/users/`)

| Méthode | Route | Permissions | Filtres / Paramètres | Description |
|---|---|---|---|---|
| GET | `/api/v1/users/` | Admin | `?role=`, `?status=`, `?is_active=`, `?search=` | Liste paginée de tous les utilisateurs avec filtres combinables |
| GET | `/api/v1/users/<id>/` | Admin | — | Détails complets d'un utilisateur (rôle, statut, dates, téléphone) |
| PATCH | `/api/v1/users/<id>/` | Admin | `status`, `role`, `first_name`, `last_name`, `phone_number` | Modifier un utilisateur (ex: suspension `suspended`, réactivation `active`) |
| DELETE | `/api/v1/users/<id>/` | Admin | — | Supprimer un compte (interdit sur son propre compte administrateur) |

### Cycle de vie des statuts utilisateurs (`status`)
- **`pending`** : Compte invité / pré-créé, en attente d'activation (`is_active = False`).
- **`active`** : Compte actif pouvant s'authentifier (`is_active = True`).
- **`suspended`** : Compte suspendu par l'administrateur (`is_active = False`).
- **`archived`** : Compte archivé / désactivé définitivement (`is_active = False`).

### Endpoints membres d'une cohorte (`/api/v1/cohorts/<id>/`)

| Méthode | Endpoint | Permissions | Corps | Description |
|---|---|---|---|---|
| GET | `/api/v1/cohorts/<id>/enrollments/` | Admin / Organizer | — | Liste des inscriptions (apprenants) |
| POST | `/api/v1/cohorts/<id>/enrollments/` | Admin / Organizer | `{emails:[...]}` | Ajouter des apprenants (auto-assignation automatique des projets) |
| GET | `/api/v1/cohorts/<id>/trainer-assignments/` | Admin / Organizer | — | Liste des formateurs affectés |
| POST | `/api/v1/cohorts/<id>/trainer-assignments/` | Admin / Organizer | `{emails:[...]}` | Ajouter des formateurs à la cohorte |
| PATCH | `/api/v1/cohorts/<id>/enrollments/<id>/` | Admin / Organizer | `{mentor: uuid\|null}` | Poser ou retirer le mentor de l'apprenant (doit être un formateur de la cohorte) |

---

## Pièces Jointes & Stockage (`/api/v1/attachments/`)

| Méthode | Route | Accès | Corps | Description |
|---|---|---|---|---|
| POST | `/api/v1/attachments/` | Authentifié | `file` (multipart/form-data) | Uploader un fichier autonome (max 10 Mo) ; stocké sous UUID sécurisé |
| GET | `/api/v1/attachments/<id>/` | Auteur ou admin | — | Détail + URL de téléchargement (signée en S3) |
| DELETE | `/api/v1/attachments/<id>/` | Auteur ou admin | — | Supprimer le fichier physique et la ligne en base |

**Lien polymorphique (GenericForeignKey)** : `Attachment` se rattache directement aux livrables (`Deliverable`) et projets (`Project`). La suppression d'un livrable ou d'un projet supprime automatiquement en cascade toutes ses pièces jointes associées.

---

## Configuration & Démarrage

### Variables d'environnement

- `.env` contient les secrets de l'application et est chargé par `django-environ` dans `base.py`.
- Base de données : PostgreSQL en production et développement principal (`DATABASE_URL`). SQLite local en secours sans variable.

### Lancer le projet (Windows / PowerShell)

```powershell
# 1. Environnement virtuel
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 2. Configuration
Copy-Item .env.example .env

# 3. Migrations & Check
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py check

# 4. Lancer le serveur
.\.venv\Scripts\python.exe manage.py runserver
```

L'API est accessible sur `http://127.0.0.1:8000/api/v1/`, Swagger sur `http://127.0.0.1:8000/api/docs/`.

### Tests

```powershell
.\.venv\Scripts\python.exe manage.py test                  # Exécuter toute la suite de tests
.\.venv\Scripts\python.exe manage.py test apps.evaluations # Tester spécifiquement les évaluations
```
