import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, RotateCcw } from 'lucide-react';

interface Question {
  question: string;
  answer: string;
  explanation: string;
  isUserQuestion?: boolean;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface Quiz {
  _id: string;
  questions: Question[];
  score: number;
  completed: boolean;
}

function QuizQuestion({ 
  question, 
  onAnswer, 
  showExplanation,
  explanation,
  isCorrect,
  userAnswer,
}: { 
  question: string; 
  onAnswer: (answer: string) => void;
  showExplanation: boolean;
  explanation: string;
  isCorrect?: boolean;
  userAnswer?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswer(inputValue);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg max-w-2xl mx-auto"
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-4">{question}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ta réponse..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
        >
          Valider <ChevronRight className="ml-2 h-5 w-5" />
        </button>
      </form>
      
      <AnimatePresence>
        {inputValue && userAnswer && !showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-4 p-4 ${
              isCorrect ? 'bg-green-50' : 'bg-red-50'
            } rounded-lg text-center`}
          >
            <p className={`font-bold ${
              isCorrect ? 'text-green-600' : 'text-red-600'
            }`}>
              {isCorrect ? 'Bravo !' : 'Ce n\'est pas la bonne réponse.'}
            </p>
          </motion.div>
        )}
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-purple-50 rounded-lg"
          >
            <h4 className="font-bold text-purple-800 mb-2">Explication :</h4>
            <p className="text-purple-900">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QuizResults({ 
  score, 
  total, 
  onRestart 
}: { 
  score: number; 
  total: number; 
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg max-w-2xl mx-auto text-center"
    >
      <div className="mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Brain className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz terminé !</h2>
        <p className="text-gray-600 mb-6">
          Tu as obtenu <span className="font-bold text-purple-600">{score}</span> sur {total} points
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-lg text-gray-700">
          {score === total ? "Parfait ! Tu as tout bon !" :
           score >= total * 0.7 ? "Très bien ! Continue comme ça !" :
           score >= total * 0.5 ? "Pas mal ! Tu peux encore t'améliorer !" :
           "Continue de t'entraîner, tu vas y arriver !"}
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/quiz-history')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            Voir l'historique
          </button>
          <button
            onClick={onRestart}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Nouveau quiz
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userScore, setUserScore] = useState(0);

  const { user } = useAuth();
  const navigate = useNavigate();

  const generateQuiz = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting quiz generation request...');
      const token = localStorage.getItem('token');
      console.log('Auth token available:', Boolean(token));
      
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Raw response text:', text);

        let data;
        try {
          data = JSON.parse(text);
          console.log('Parsed response data:', data);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error('Invalid JSON response from server');
        }

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.error || 'Failed to generate quiz');
      }

      // Detailed logging of quiz data structure
      console.log('Examining quiz data structure:', {
        hasId: Boolean(data._id),
        hasQuestions: Boolean(data.questions),
        questionsLength: data.questions?.length,
        firstQuestion: data.questions?.[0]
      });

      // Detailed validation of quiz structure
      if (!data._id) {
        console.error('Quiz data missing _id:', data);
        throw new Error('Quiz data missing ID');
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        console.error('Invalid quiz questions structure:', {
          dataType: typeof data,
          hasQuestions: Boolean(data.questions),
          questionsType: data.questions ? typeof data.questions : 'undefined',
          fullData: data
        });
        throw new Error('Invalid quiz data received from server');
      }

      // Detailed validation of each question
      const invalidQuestions = data.questions.filter((q: Question) => {
        const issues = {
          missingQuestion: !q.question,
          missingAnswer: !q.answer,
          missingExplanation: !q.explanation,
          invalidQuestionType: typeof q.question !== 'string',
          invalidAnswerType: typeof q.answer !== 'string',
          invalidExplanationType: typeof q.explanation !== 'string'
        };
        
        const isInvalid = Object.values(issues).some(Boolean);
        if (isInvalid) {
          console.warn('Invalid question format:', { question: q, issues });
        }
        return isInvalid;
      });
      if (invalidQuestions.length > 0) {
        console.error('Found invalid questions:', invalidQuestions);
        throw new Error('Some questions are missing required fields');
      }

      console.log('Le quiz est valide et prêt à être affiché:');
      setQuiz(data);
      setCurrentQuestionIndex(0);
      setUserScore(0);
      setShowExplanation(false);
    } catch (error) {
      console.error('Quiz generation error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    generateQuiz();
  }, [user, navigate]);

  const handleAnswer = async (answer: string) => {
    if (!quiz) return;

    // Store the answer and check if correct
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrectAnswer = currentQuestion.answer.toLowerCase().trim();
    const isCorrect = normalizedAnswer === normalizedCorrectAnswer;

    // Update question with user's answer and correctness
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect
    };
    setQuiz({
      ...quiz,
      questions: updatedQuestions
    });

    // Update score
    const newScore = isCorrect ? userScore + 1 : userScore;
    setUserScore(newScore);

    // Show explanation
    setShowExplanation(true);

    // Wait for explanation time
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (currentQuestionIndex < quiz.questions.length - 1) {
      console.log('Moving to next question:', currentQuestionIndex + 1);
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      console.log('Quiz completed with score:', newScore);
      // Update quiz completion status
      try {
        const response = await fetch(`/api/quiz/${quiz._id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed: true,
            score: newScore,
            questions: updatedQuestions,
            totalQuestions: quiz.questions.length
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update quiz status');
        }

        console.log('Quiz status updated successfully');
        // Navigate to quiz history after a brief delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        navigate('/quiz-history');
      } catch (error) {
        console.error('Failed to update quiz status:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-700">Génération du quiz...</p>
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
            onClick={generateQuiz}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  const showResults = currentQuestionIndex === quiz.questions.length - 1 && showExplanation;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 py-12 px-4">
      {!showResults ? (
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Question {currentQuestionIndex + 1} sur {quiz.questions.length}
          </h2>
          <div className="w-full max-w-2xl mx-auto bg-white/20 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {showResults ? (
          <QuizResults
            key="results"
            score={userScore}
            total={quiz.questions.length}
            onRestart={generateQuiz}
          />
        ) : (
          <QuizQuestion
            key={currentQuestionIndex}
            question={quiz.questions[currentQuestionIndex].question}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
            explanation={quiz.questions[currentQuestionIndex].explanation}
            isCorrect={quiz.questions[currentQuestionIndex].isCorrect}
            userAnswer={quiz.questions[currentQuestionIndex].userAnswer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuizPage;
