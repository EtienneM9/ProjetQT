import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Brain, Book, Award, ArrowUp, ArrowDown, Calendar, ChevronLeft, Home, Grid, List, Eye } from 'lucide-react';
import QuizHistoryModal from './QuizHistoryModal';

interface Question {
  question: string;
  answer: string;
  explanation: string;
}

interface QuizHistoryEntry {
  _id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

interface QuizStats {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalCompleted: number;
}

const StatCard = ({ icon: Icon, title, value, color }: { 
  icon: React.ElementType; 
  title: string; 
  value: string | number;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg ${color}`}
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-purple-100 rounded-lg">
        <Icon className="h-6 w-6 text-purple-600" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </motion.div>
);

const QuizHistoryCard = ({ quiz, onClick }: { quiz: QuizHistoryEntry; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={onClick}
    className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg transform transition hover:scale-105 cursor-pointer group"
  >
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-xl font-bold text-gray-800">Quiz #{quiz._id.slice(-4)}</h3>
        <p className="text-gray-500">
          {new Date(quiz.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-purple-600">{quiz.score}/{quiz.totalQuestions}</p>
        <p className={`text-sm font-medium ${
          quiz.percentage >= 80 ? 'text-green-500' :
          quiz.percentage >= 60 ? 'text-yellow-500' :
          'text-red-500'
        }`}>
          {Math.round(quiz.percentage)}%
        </p>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
        <button className="p-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

export default function QuizHistory() {
  const [quizzes, setQuizzes] = useState<QuizHistoryEntry[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);

  const handleQuizClick = (quizId: string) => {
    setSelectedQuiz(quizId);
  };

  const handleCloseModal = () => {
    setSelectedQuiz(null);
  };

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchQuizHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/quizzes', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch quiz history');
        }

        setQuizzes(data.quizzes);
        setStats(data.stats);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizHistory();
  }, [user, navigate]);

  const sortedQuizzes = [...quizzes].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' 
        ? a.percentage - b.percentage 
        : b.percentage - a.percentage;
    }
  });

  const toggleSort = (type: 'date' | 'score') => {
    if (sortBy === type) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-700">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg text-center">
          <p className="text-red-600 mb-4">Une erreur est survenue: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="bg-white/90 hover:bg-white text-purple-600 font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              Accueil
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="bg-white/90 hover:bg-white text-purple-600 font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center gap-2"
            >
              <Brain className="h-5 w-5" />
              Nouveau quiz
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Historique des Quiz</h1>
            <p className="text-white/90">
              Suis ta progression
            </p>
          </div>
          <div className="w-32"></div> {/* Spacer for flex balance */}
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={Book}
              title="Quiz Complétés"
              value={stats.totalCompleted}
              color="hover:shadow-blue-100/50"
            />
            <StatCard
              icon={Award}
              title="Meilleur Score"
              value={`${Math.round(stats.bestScore)}/10`}
              color="hover:shadow-green-100/50"
            />
            <StatCard
              icon={Brain}
              title="Score Moyen"
              value={`${Math.round(stats.averageScore)} /10`}
              color="hover:shadow-yellow-100/50"
            />
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
            <button
              onClick={() => toggleSort('date')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                sortBy === 'date' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Date</span>
              {sortBy === 'date' && (
                sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => toggleSort('score')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                sortBy === 'score' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Score</span>
              {sortBy === 'score' && (
                sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
              )}
            </button>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={`${
            viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'
          }`}>
            {sortedQuizzes.map(quiz => (
              <QuizHistoryCard 
                key={quiz._id} 
                quiz={quiz} 
                onClick={() => handleQuizClick(quiz._id)}
              />
            ))}
            {sortedQuizzes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-6">
                  Aucun quiz complété pour le moment. 
                  Commence à t'entraîner pour voir ton historique !
                </p>
                <button
                  onClick={() => navigate('/quiz')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center gap-2 mx-auto"
                >
                  <Brain className="h-5 w-5" />
                  Commencer un quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedQuiz && (
        <QuizHistoryModal
          quiz={quizzes.find(q => q._id === selectedQuiz)!}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
