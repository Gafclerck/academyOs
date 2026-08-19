# 🎓 Squad Baol — Academy OS

Plateforme moderne de gestion pédagogique, administrative et de suivi des cohortes et formations pour **Xarala / Academy OS**.

---

## 🏗️ Architecture du Projet

Le projet est structuré sous forme de monorepo :

```text
AcademyOS/
├── academy-os-api/          # Backend Django REST Framework (Python 3.12+)
│   ├── apps/
│   │   ├── users/           # Authentification, gestion des rôles et profils
│   │   ├── programs/        # Gestion des programmes de formation
│   │   ├── cohorts/         # Gestion des rentrées (intakes) et cohortes
│   │   ├── certificates/    # Génération et suivi des certificats
│   │   ├── attachments/     # Stockage et téléversement de fichiers
│   │   ├── pedagogy/        # Modules pédagogiques
│   │   ├── evaluations/     # Évaluations et notes
│   │   └── core/            # Modèles de base, pagination, permissions
│   ├── config/              # Configuration Django (settings, urls, asgi/wsgi)
│   └── requirements.txt     # Dépendances Python
│
├── academy-os-client/       # Frontend React 19 + TypeScript + Vite + TailwindCSS
│   ├── src/
│   │   ├── api/             # Configuration Axios & instances API
│   │   ├── components/      # Composants UI partagés (Shadcn UI, design system)
│   │   ├── context/         # AuthContext & state global
│   │   ├── modules/         # Modules métier (programme, rentrée, cohorte)
│   │   ├── pages/           # Vues et pages principales
│   │   └── routes/          # Définition des routes React Router v7
│   └── package.json         # Dépendances NPM
│
├── docker-compose.yml       # Orchestration des services locaux (Backend, PostgreSQL, Redis)
└── README.md                # Documentation du repository
```

---

## 🚀 Démarrage Rapide

### Option A : Avec Docker (Recommandé)

1. **Cloner le repository et copier les variables d'environnement :**
   ```bash
   cp .env.example .env
   ```

2. **Lancer les services avec Docker Compose :**
   ```bash
   docker compose up --build
   ```

3. **Accès aux services :**
   - **Backend API :** [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
   - **Documentation Swagger UI :** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
   - **Documentation ReDoc :** [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
   - **Admin Django :** [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

### Option B : Démarrage Manuel

#### 1. Backend (`academy-os-api`)

```bash
cd academy-os-api

# Créer et activer l'environnement virtuel
python -m venv .venv
source .venv/bin/activate   # Sur Linux/macOS
# ou : .venv\Scripts\activate  # Sur Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env

# Appliquer les migrations
python manage.py migrate

# Lancer le serveur de développement
python manage.py runserver
```

#### 2. Frontend (`academy-os-client`)

```bash
cd academy-os-client

# Installer les dépendances
npm install

# Démarrer le serveur de développement Vite
npm run dev
```

L'application client sera accessible sur [http://localhost:5173](http://localhost:5173).

---

## 🧪 Tests & Qualité de Code

### Backend
```bash
cd academy-os-api
python manage.py test
```

### Frontend
```bash
cd academy-os-client
npm run lint    # Linter ESLint
npm run build   # Vérification des types TypeScript et build de production
```

---

## 🌿 Stratégie Git & Workflow

- **`main`** : Branche de production protégée (réservée aux releases stables validées par le mentor).
- **`dev`** : Branche principale d'intégration (les développeurs y soumettent leurs PR / MR).
- **Branches de fonctionnalités :** `feat/<nom-fonctionnalite>`, `fix/<nom-correctif>`.

---

## 👥 Équipe & Mentolat

- **Organisation :** Xarala Academy — Squad Baol
- **Lead Développeur :** Équipe Squad Baol
- **Licence :** Propriétaire
