import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-white mb-8">Page non trouvée</h2>
        <p className="text-white/90 text-lg mb-8">
          Oups ! La page que tu cherches n'existe pas.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-full font-medium hover:bg-purple-50 transition-colors shadow-lg"
        >
          <Home className="w-5 h-5" />
          Retour à l'accueil 
        </Link>
      </div>
    </div>
  );
}
