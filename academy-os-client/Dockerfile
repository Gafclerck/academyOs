FROM node:20-alpine

WORKDIR /app

# Copie des fichiers de configuration des dépendances
COPY package.json package-lock.json ./

# Installation des dépendances dans le conteneur
RUN npm install

# Copie du reste des sources
COPY . .

EXPOSE 5173

# Démarrage du serveur de développement Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
