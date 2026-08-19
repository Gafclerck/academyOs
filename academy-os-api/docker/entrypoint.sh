#!/bin/sh
set -e

echo "==> [Bootstrap] Application des migrations de la base de données..."
python manage.py migrate --noinput

echo "==> [Bootstrap] Vérification / Création du superuser initial..."
python manage.py ensure_admin

echo "==> [Bootstrap] Démarrage du serveur Django..."
exec "$@"