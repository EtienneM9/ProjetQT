import type { Request, Response } from 'express';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { connectDB } from '../../lib/db';
import Quiz from '../../lib/db/models/Quiz';
import { authMiddleware, AuthRequest } from '../../lib/auth/middleware';
import type { Connect } from 'vite';

type ExpressStyleResponse = ServerResponse & {
  status?(code: number): ExpressStyleResponse;
  json?(data: any): void;
};

interface RequestWithBody extends IncomingMessage {
  body?: any;
  user?: { _id: string };
}

export const getQuizzesHandler = async (req: RequestWithBody, res: ExpressStyleResponse) => {
  try {
    await connectDB();

    const userId = req.user?._id;
    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    const quizzes = await Quiz.find({ 
      userId,
      completed: true
    })
    .sort({ createdAt: -1 })
    .select({
      score: 1,
      completed: 1,
      createdAt: 1,
      updatedAt: 1,
      questions: 1,
      totalQuestions: { $size: '$questions' }
    });

    // Calculate statistics
    const stats = {
      totalQuizzes: quizzes.length,
      averageScore: quizzes.length > 0 
        ? quizzes.reduce((sum, quiz) => sum + quiz.score, 0) / quizzes.length 
        : 0,
      bestScore: quizzes.length > 0 
        ? Math.max(...quizzes.map(quiz => quiz.score)) 
        : 0,
      totalCompleted: quizzes.length,
    };
    console.log('Quiz Statistics:', stats);
    
    // Format response
        const formattedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      score: quiz.score,
      questions: quiz.questions,
      totalQuestions: quiz.totalQuestions || quiz.questions.length,
      percentage: ((quiz.score / (quiz.totalQuestions || quiz.questions.length)) * 100) || 0,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    }));

    console.log('Formatted Quizzes:', formattedQuizzes);
    res.statusCode = 200;
    res.json?.({ quizzes: formattedQuizzes, stats }) || 
      res.end(JSON.stringify({ quizzes: formattedQuizzes, stats }));

  } catch (error) {
    console.error('Fetch Quizzes Error:', error);
    res.statusCode = 500;
    res.json?.({ error: error instanceof Error ? error.message : 'An error occurred while fetching quizzes' }) || 
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred while fetching quizzes' }));
  }
};

export const quizzesPlugin = (): Plugin => {
  return {
    name: 'vite-quizzes-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/quizzes', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        if (req.method === 'GET') {
          try {
            await authMiddleware(req as AuthRequest, res as ExpressStyleResponse, async () => {
              await getQuizzesHandler(req, res);
            });
          } catch (error) {
            console.error('Error in quizzes middleware:', error);
            res.statusCode = 500;
            res.json?.({ error: 'Internal server error' }) || 
              res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
};
