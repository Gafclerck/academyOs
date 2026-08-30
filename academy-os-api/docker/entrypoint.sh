#!/bin/sh
set -e

# Ne migrer / créer l'admin que pour le process web (évite la collision avec
# le worker Celery qui partage cette même image/entrypoint).
if [ "$1" = "daphne" ]; then
  echo "==> [Bootstrap] Application des migrations de la base de données..."
  python manage.py migrate --noinput

  echo "==> [Bootstrap] Collecte des fichiers statiques..."
  python manage.py collectstatic --noinput

  echo "==> [Bootstrap] Vérification / Création du superuser initial..."
  python manage.py ensure_admin
fi

echo "==> [Bootstrap] Démarrage : $@"
exec "$@"