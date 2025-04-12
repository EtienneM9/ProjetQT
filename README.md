# MathMagic

# MathMagic 🧮✨

MathMagic est un assistant pédagogique intelligent spécialisé pour aider les enfants autistes à apprendre les mathématiques de manière ludique et interactive.

## Fonctionnalités 🌟

- 🤖 Assistant IA personnalisé utilisant Mistral AI
- 🎯 Quiz dynamiques générés à partir de l'historique des conversations avec suivi de la progression
- 🗣️ Reconnaissance vocale pour une interaction naturelle
- 🔊 Synthèse vocale pour des explications claires
- 📝 Historique des conversations persistant
- 🎨 Interface utilisateur adaptée et intuitive
- 🔒 Authentification sécurisée
- 🌐 Support multilingue (Français)

## Prérequis 📋

- Node.js 18 ou plus récent
- MongoDB
- Clé API Mistral AI

## Installation 🚀

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-username/mathmagic.git
cd mathmagic
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
```
Puis modifiez le fichier `.env` avec vos propres valeurs.

4. Lancer le serveur de développement :
```bash
npm run dev
```

## Structure du Projet 📁

```
src/
├── api/              # Routes de l'API (chat, quiz, auth)
├── components/       # Composants React réutilisables
├── context/         # Contextes React (Auth, Chat)
├── lib/             # Utilitaires et configurations
├── pages/           # Pages principales
└── types/           # Types TypeScript
```

## Technologies Utilisées 💻

- React + Vite
- TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- Mistral AI API
- Web Speech API
- JWT Authentication
- Express (via Vite Plugin)


## License 📄

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.


## Deployment Guide

### Frontend Deployment (Vercel)

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the following environment variables in your Vercel project settings:
   - `VITE_API_URL`: URL of your deployed backend (e.g., https://your-backend-url.com)
   - `VITE_MISTRAL_API_KEY`: Your Mistral API key
   - `VITE_ENABLE_VOICE_SYNTHESIS`: true
   - `VITE_ENABLE_VOICE_RECOGNITION`: true

### Backend Deployment (Railway)

1. Create a new project on Railway (https://railway.app)
2. Connect your GitHub repository to Railway
3. Add the following environment variables in your Railway project settings:
   ```
   PORT=5000
   HOST=0.0.0.0
   VITE_MONGO_CONNECTION_STRING=your_mongodb_connection_string
   VITE_JWT_SECRET=your_jwt_secret
   VITE_MISTRAL_API_KEY=your_mistral_api_key
   FRONTEND_URL=your_vercel_app_url
   ```
4. Make sure to set `FRONTEND_URL` to your Vercel app URL for CORS
5. Railway will automatically detect the `start` script in package.json and run the server

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the required environment variables
4. Start the development server:
   ```bash
   # Start frontend
   npm run dev
   
   # In another terminal, start backend
   npm run dev:server
   ```

### Environment Variables

- `VITE_MONGO_CONNECTION_STRING`: MongoDB connection string
- `VITE_JWT_SECRET`: Secret key for JWT authentication
- `VITE_MISTRAL_API_KEY`: API key for Mistral AI
- `PORT`: Backend server port (default: 5000)
- `HOST`: Backend server host (default: 0.0.0.0)
- `FRONTEND_URL`: URL of your frontend application (for CORS)
- `VITE_API_URL`: URL of your backend API (used by frontend)
- `VITE_ENABLE_VOICE_SYNTHESIS`: Enable voice synthesis feature
- `VITE_ENABLE_VOICE_RECOGNITION`: Enable voice recognition feature

## Troubleshooting

### API Connection Issues
If you're getting connection errors:
1. Check that your backend is running and accessible
2. Verify that `VITE_API_URL` is set correctly in your frontend environment
3. Ensure CORS is properly configured with your frontend URL
4. Check that all required environment variables are set

### MongoDB Connection
If you're having issues with MongoDB:
1. Verify your MongoDB connection string
2. Ensure your IP address is whitelisted in MongoDB Atlas
3. Check that your database user has the correct permissions
