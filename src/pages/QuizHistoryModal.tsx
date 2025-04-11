import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle } from 'lucide-react';

interface QuizDetails {
  _id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: string;
  questions: Array<{
    question: string;
    answer: string;
    explanation: string;
    isCorrect?: boolean;
    userAnswer?: string;
  }>;
}

interface Props {
  quiz: QuizDetails;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuizHistoryModal({ quiz, isOpen, onClose }: Props) {
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { type: "spring", duration: 0.5 }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.95,
            transition: { duration: 0.2 }
          }}
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
        >
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Détails du Quiz #{quiz._id.slice(-4)}
              </h2>
              <p className="text-gray-500">
                {new Date(quiz.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="h-6 w-6 text-gray-500 transition-colors hover:text-gray-700" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Score</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {quiz.score}/{quiz.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Pourcentage</p>
                  <p className={`text-2xl font-bold ${
                    quiz.percentage >= 80 ? 'text-green-600' :
                    quiz.percentage >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(quiz.percentage)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Questions</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {quiz.totalQuestions}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {quiz.questions.map((q, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
                    index === quiz.questions.length - 1 ? 'mb-4' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-medium text-gray-600 mb-1">
                        Question {index + 1}
                      </p>
                      <p className="text-gray-900">
                        {q.question}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {q.isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-gray-600">
                        Réponse :
                      </p>
                      {q.userAnswer && (
                        <p className={`text-sm font-medium ${
                          q.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Ta réponse : {q.userAnswer}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-900 mb-3 font-medium">
                      {q.answer}
                    </p>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Explication :
                    </p>
                    <p className="text-gray-900">
                      {q.explanation}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
