import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Brain, Crown, Rocket, Trophy, History } from 'lucide-react';
import Assistant from './Assistant';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import NotFound from './pages/NotFound';
import QuizPage from './pages/Quiz';
import QuizHistory from './pages/QuizHistory';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-blue-400 to-purple-500">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Apprends les maths en t'amusant !
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Une aventure mathématique extraordinaire pour les 6-12 ans
          </p>
          <button 
            onClick={() => navigate('/assistant')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
          >
            Commence l'aventure !
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="grid grid-cols-2 gap-8">
            <FeatureCard 
              icon={<Brain className="h-8 w-8" />}
              title="Générer un quiz"
              description="Génère des quiz à partir de tes chats précédents"
              onClick={() => navigate('/quiz')}
            />
            <FeatureCard 
              icon={<History className="h-8 w-8" />}
              title="Historique"
              description="Consulte tes scores et ta progression"
              onClick={() => navigate('/quiz-history')}
            />
          </div>
          <FeatureCard 
            icon={<Trophy className="h-8 w-8" />}
            title="Gagne des Points"
            description="Collectionne des étoiles et des badges en résolvant des problèmes"
          />
          <FeatureCard 
            icon={<Rocket className="h-8 w-8" />}
            title="Défis Quotidiens"
            description="De nouveaux défis chaque jour pour tester tes connaissances"
          />
        </div>

        {/* Learning Path Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Ton parcours d'apprentissage</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <LearningStep 
              number="1"
              title="Découvre"
              description="Commence par les bases"
            />
            <LearningStep 
              number="2"
              title="Pratique"
              description="Résous des exercices"
            />
            <LearningStep 
              number="3"
              title="Maîtrise"
              description="Deviens un expert"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg transform transition hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <div className="text-purple-600 mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function LearningStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg w-full md:w-64">
      <div className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            {/* Auth Routes (no layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Routes with Layout */}
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute>
                    <Assistant />
                  </ProtectedRoute>
                }
              />
            <Route
                path="/quiz"
                element={
                  <ProtectedRoute>
                    <QuizPage />
                  </ProtectedRoute>
                }
              />
            <Route
                path="/quiz-history"
                element={
                  <ProtectedRoute>
                    <QuizHistory />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
