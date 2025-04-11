import React from 'react';
import { Calculator, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Calculator className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-purple-600">MathMagic</h1>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link 
                to="/assistant" 
                className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
              >
                Assistant
              </Link>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
