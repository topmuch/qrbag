# QRBag 📦

Système de suivi de colis et bus pour l'Afrique de l'Ouest avec QR Code.

![QRBag Dashboard](https://via.placeholder.com/800x400?text=QRBag+Dashboard)

## 🚀 Fonctionnalités

### Pour les Chauffeurs
- 📱 Scanner QR Code pour activer les colis
- 📸 Photo du colis à l'activation
- 📋 Gestion des trajets en cours
- 📦 Liste des colis en transit

### Pour les Propriétaires
- 🚌 Gestion des bus et chauffeurs
- 🗺️ Création de routes avec checkpoints
- 📊 Tableau de bord avec statistiques
- 📱 Génération de QR codes en lot

### Pour les Admins
- 🏢 Gestion des compagnies de transport
- 📈 Statistiques globales
- ⚙️ Configuration du système

## 🛠️ Stack Technique

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **UI**: shadcn/ui, Framer Motion

## 📦 Installation

### Développement local

```bash
# Cloner le repository
git clone https://github.com/topmuch/qrbag.git
cd qrbag

# Installer les dépendances
bun install

# Configurer l'environnement
cp .env.example .env

# Initialiser la base de données
bun run db:push

# Démarrer le serveur
bun run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

### Production avec Docker

```bash
# Construire l'image
docker build -t qrbag .

# Lancer le conteneur
docker run -p 3000:3000 -v qrbag_data:/app/data qrbag
```

## 🚀 Déploiement sur Coolify

### Méthode 1 : Via GitHub (recommandé)

1. Connectez-vous à votre Coolify
2. Cliquez sur **"New Resource"** → **"Service"**
3. Sélectionnez **"Git Repository"**
4. Entrez l'URL : `https://github.com/topmuch/qrbag`
5. Coolify détectera automatiquement le `Dockerfile`
6. Configurez les variables d'environnement :
   - `DATABASE_URL` = `file:/app/data/prod.db`
7. Cliquez sur **"Deploy"**

### Méthode 2 : Via Docker Compose

1. Dans Coolify, créez un nouveau **"Docker Compose"**
2. Collez le contenu de `docker-compose.yml`
3. Déployez

### Variables d'environnement importantes

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `DATABASE_URL` | URL de la base de données | `file:/app/data/prod.db` |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Nom de l'application | `QRBag` |

## 📁 Structure du projet

```
qrbag/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   │   ├── api/          # API Routes
│   │   ├── owner/        # Dashboard Propriétaire
│   │   ├── driver/       # Dashboard Chauffeur
│   │   └── admin/        # Dashboard Admin
│   ├── components/       # Composants React
│   └── lib/              # Utilitaires
├── prisma/               # Schéma base de données
├── public/               # Assets statiques
├── Dockerfile            # Pour le déploiement
└── docker-compose.yml    # Orchestration Docker
```

## 🔐 Sécurité

- Les fichiers `.env` et la base de données ne sont PAS inclus dans le repository
- Les uploads utilisateurs sont stockés dans `/public/uploads/` (exclu du repo)

## 📄 Licence

MIT License

## 👥 Auteur

Développé par [TopMuch](https://github.com/topmuch)
