# Academy OS API

API REST Django du projet **Academy OS**

## Stack technique

- Django 5.2
- Django REST Framework 3.17
- djangorestframework-simplejwt (authentification par JWT)
- drf-spectacular (documentation OpenAPI / Swagger)
- django-environ (configuration par variables d'environnement, 12-factor)
- pytest + pytest-django (tests)

## Architecture du projet

```
academy-os-api/
├── manage.py                # outils de développement ; module de settings par défaut
├── pytest.ini               # configuration des tests
├── config/
│   ├── settings/
│   │   ├── base.py          # configuration commune (apps, DRF, JWT, CORS, base de données)
│   │   ├── development.py   # environnement de développement (DEBUG, CORS ouvert, email console)
│   │   └── production.py    # environnement de production (DEBUG off, HSTS, cookies sécurisés)
│   ├── urls.py              # routage : /admin/, /api/auth/, /api/schema|docs|redoc/
│   ├── wsgi.py              # point d'entrée WSGI ; module de settings par défaut : production
│   └── asgi.py              # point d'entrée ASGI ; module de settings par défaut : production
└── apps/
    ├── users/               # modèle utilisateur personnalisé (apps.users)
    └── core/                # Socle technique du projet fournissant des briques réutilisables : modèles abstraits (`TimeStampedModel`, `UUIDModel`), permissions globales, gestion d'exceptions personnalisée, utilitaires et mixins DRF.

```

### Organisation des applications

- Les applications vivent sous `apps/` avec des chemins d'import dotted (ex. `apps.users`). Toute nouvelle application doit être déclarée dans `LOCAL_APPS` dans `config/settings/base.py`.
- Modèle utilisateur personnalisé : `AUTH_USER_MODEL = 'users.User'`. Les clés étrangères vers un utilisateur doivent référencer `settings.AUTH_USER_MODEL`, jamais le modèle `User` par défaut.
- Routes exposées : `/api/auth/` pour l'authentification, ainsi que la documentation OpenAPI sur `/api/schema/`, `/api/docs/` (Swagger) et `/api/redoc/`. Les nouveaux endpoints doivent être annotés avec drf-spectacular.

## Configuration

### Sélection du module de settings

Le module de settings est choisi **uniquement** via la variable d'environnement `DJANGO_SETTINGS_MODULE`. Les points d'entrée utilisent `os.environ.setdefault(...)`, c'est-à-dire qu'une valeur **par défaut** est appliquée seulement si la variable n'est pas déjà définie dans l'environnement : la valeur du shell fait toujours foi.

### Variables d'environnement

- Le fichier `.env` contient les secrets de l'application et est chargé par django-environ dans `base.py`. Il se crée à partir de `.env.example`.
- `SECRET_KEY` est obligatoire et doit être propre à chaque environnement. Une clé forte est déjà renseignée dans le `.env` local.

### Base de données

- `base.py` lit la variable `DATABASE_URL` via `env.db()`. Par défaut, le projet utilise la base SQLite locale (`db.sqlite3`) ( A fixer avec le docker-compose pour la base PostgreSQL en dev ).

### API et authentification

- Authentification par JWT (Bearer) via simplejwt, avec rotation des refresh tokens et blacklist des tokens révoqués.
- Permission par défaut : `IsAuthenticated`. Les endpoints publics doivent explicitement déclarer `permission_classes = [AllowAny]` et choisir un scope de throttling.
- Rendus et parsers JSON uniquement.
- Limites de débit : `anon` 100/jour, `user` 1000/jour, `login` 5/min, `register` 10/h.
- CORS : ouvert en développement (`CORS_ALLOW_ALL_ORIGINS`), restreint en production à `CORS_ALLOWED_ORIGINS` (à configurer dans `.env` avec l'origine du front).

## Lancer le projet

Prérequis : Python 3.13.

```powershell
# 1. Environnement virtuel (à créer une première fois)
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 2. Fichier de configuration
Copy-Item .env.example .env   # puis renseigner les valeurs réelles

# 3. Migrations
.\.venv\Scripts\python.exe manage.py migrate

# 4. Serveur de développement
.\.venv\Scripts\python.exe manage.py runserver
```

L'API est alors disponible sur `http://127.0.0.1:8000/`, la documentation sur `/api/docs/`.

## Tests

```powershell
.\.venv\Scripts\python.exe manage.py test
.\.venv\Scripts\python.exe -m pytest
```

Le module de settings des tests est défini dans `pytest.ini`.
