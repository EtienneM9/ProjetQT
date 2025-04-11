# MathMagic 🧮✨

MathMagic est un assistant pédagogique intelligent spécialisé pour aider les enfants autistes à apprendre les mathématiques de manière ludique et interactive.

## Fonctionnalités 🌟

- 🤖 Assistant IA personnalisé utilisant Mistral AI
- 🎯 Quiz dynamiques générés à partir de l'historique des conversations
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

## Contribution 🤝

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## License 📄

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Contact 📧

Votre Nom - [@votre_twitter](https://twitter.com/votre_twitter) - email@exemple.com

Lien du projet: [https://github.com/votre-username/mathmagic](https://github.com/votre-username/mathmagic)
