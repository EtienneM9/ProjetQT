import type { Request, Response } from 'express';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import MistralClient from '@mistralai/mistralai';
import { connectDB } from '../../lib/db';
import Chat from '../../lib/db/models/Chat';
import Message from '../../lib/db/models/Message';
import Quiz from '../../lib/db/models/Quiz';
import { authMiddleware, AuthRequest } from '../../lib/auth/middleware';
import type { Connect } from 'vite';

// Helper function to extract numerical answer from bot response
const extractAnswerFromResponse = (response: string): string | null => {
  // Common patterns to find answers in French responses
  const patterns = [
    /(?:la )?réponse(?:\s+est|\s*:)\s*(\d+)/i,   // "la réponse est 42" or "réponse: 42"
    /(?:le )?résultat(?:\s+est|\s*:)\s*(\d+)/i,  // "le résultat est 42"
    /(?:cela fait|ça fait|fait)\s+(\d+)/i,       // "cela fait 42"
    /=\s*(\d+)/,                                  // "= 42"
    /(\d+)\s*$/,                                  // Number at the end of the string
    /^(\d+)$/                                     // Just a number
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If no patterns match, try to find any number in the response
  const numberMatch = response.match(/\d+/);
  if (numberMatch) {
    return numberMatch[0];
  }

  return null;
};

const SYSTEM_MESSAGE = `You are a math quiz generator for 8-year-old children.  
Based on the provided question history, generate new, similar but slightly different questions.  
Make sure the questions are appropriate for the child’s level.

[IMPORTANT] You MUST:  
1. Respond ONLY in valid JSON  
2. DO NOT add any text before or after the JSON  
3. DO NOT include any explanations or comments  
4. Include EXACTLY these fields for each question: "question", "answer", "explanation"  
5. Use double quotes for all strings  
6. DO NOT include duplicate questions in a quiz  
7. RESPOND IN FRENCH  
8. DO NOT add backslashes (\) before symbols like * or ?  
   Example — INCORRECT: "Combien font 14 \* 2 ?"  
             CORRECT: "Combien font 14 * 2 ?"
9. In the answer field, put the real answer to the question in the question field
Use EXACTLY this format:

{
    "questions": [
        {
            "question": "Combien font 5 + 3 ?",
            "answer": "8",
            "explanation": "Pour additionner 5 et 3, on compte 5, puis on ajoute 3 : 5, 6, 7, 8. Donc 5 + 3 = 8."
        },
        {
            "question": "Si tu as 10 bonbons et tu en donnes 4, combien t'en reste-t-il ?",
            "answer": "6",
            "explanation": "Pour soustraire 4 de 10, on part de 10 et on enlève 4 : 10, 9, 8, 7, 6. Donc 10 - 4 = 6."
        }
    ]
}

ONLY REPLY WITH THE JSON, nothing else. The format must be parsable by JSON.parse()
`;

interface HandlerOptions {
  apiKey: string;
}

type ExpressStyleResponse = ServerResponse & {
  status?(code: number): ExpressStyleResponse;
  json?(data: any): void;
};

interface RequestWithBody extends IncomingMessage {
  body?: any;
  user?: { _id: string };
}

// Handler for creating a new quiz
export const createQuizHandler = (options: HandlerOptions) => async (req: RequestWithBody, res: ExpressStyleResponse) => {
  try {
    const { apiKey } = options;
    if (!apiKey) {
      res.statusCode = 500;
      return res.json?.({ error: 'API key is required' }) || 
        res.end(JSON.stringify({ error: 'API key is required' }));
    }

    console.log('Starting quiz generation...');
    await connectDB();
    console.log('Database connected');
    
    // Initialize MistralClient
    const client = new MistralClient(apiKey);
    console.log('Mistral client initialized');

    const userId = req.user?._id;
    console.log('User ID:', userId);

    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    // Get last 10 chats with their messages
    const recentChats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10);
    console.log('Recent chats found:', recentChats.length);

    if (recentChats.length === 0) {
      res.statusCode = 400;
      return res.json?.({ error: 'Aucun historique de chat trouvé. Commence par discuter avec l\'assistant !' }) || 
        res.end(JSON.stringify({ error: 'Aucun historique de chat trouvé. Commence par discuter avec l\'assistant !' }));
    }

    const chatMessages = await Message.find({
      chatId: { $in: recentChats.map(chat => chat._id) }
    }).sort({ createdAt: -1 });
    console.log('Chat messages found:', chatMessages.length);

    if (chatMessages.length === 0) {
      res.statusCode = 400;
      return res.json?.({ error: 'Aucun message trouvé dans l\'historique. Commence par discuter avec l\'assistant !' }) || 
        res.end(JSON.stringify({ error: 'Aucun message trouvé dans l\'historique. Commence par discuter avec l\'assistant !' }));
    }

    // Format chat history for AI
    const chatHistory = chatMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    console.log('Chat history formatted for AI, length:', chatHistory.length);

    console.log('Sending request to Mistral AI...');
    // Generate new questions based on chat history
    const response = await client.chat({
      model: "mistral-medium",
      temperature: 0.3, // Lower temperature for more structured output
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        ...chatHistory,
        { 
          role: "user", 
          content: "Génère EXACTEMENT 11 questions de mathématiques basées sur ces conversations. Respecte STRICTEMENT le format JSON." 
        }
      ]
    });

    if (!response.choices || !response.choices[0]?.message?.content) {
      console.error('Invalid response from Mistral AI:', response);
      throw new Error('Invalid response from Mistral AI');
    }

    const aiContent = response.choices[0].message.content;
    console.log('Received AI response:', aiContent);
    let generatedQuestions;

    // Sanitize AI response by removing unwanted escape characters
    const sanitizeAIResponse = (content: string): string => {
      return content
        .replace(/\\([*?])/g, '$1')  // Remove escape chars before * and ?
        .replace(/\\\\/g, '\\');     // Handle double escapes
    };

    try {
      // Sanitize the response before parsing
      const sanitizedContent = sanitizeAIResponse(aiContent);
      console.log('Sanitized AI response:', sanitizedContent);
      // First try parsing complete response
      let parsed;
      try {
        parsed = JSON.parse(sanitizedContent);
        if (Array.isArray(parsed.questions)) {
          console.log('Successfully parsed complete response as JSON');
          generatedQuestions = parsed.questions;
          console.log('Questions:', generatedQuestions);
        } else {
          throw new Error('Invalid format');
        }
      } catch (e) {
        // If direct parsing fails, try pattern matching
        console.log('Attempting alternative JSON extraction methods...');
        const patterns = [
          /\{[\s\S]*\}/,  // Match anything between { and }
          /\{(?:[^{}]|{[^{}]*})*\}/,  // Match nested objects
          /\{[^]*\}/  // Most permissive - match everything between first { and last }
        ];

        let jsonMatch = null;
        for (const pattern of patterns) {
          const match = sanitizedContent.match(pattern);
          if (match) {
            jsonMatch = match[0];
            console.log('Found JSON using pattern:', pattern);
            break;
          }
        }

        if (!jsonMatch) {
          console.error('No JSON-like structure found in response:', aiContent);
          throw new Error('Response does not contain valid JSON structure');
        }

        console.log('Attempting to parse extracted content:', jsonMatch);
        parsed = JSON.parse(jsonMatch);
      }

      if (!Array.isArray(parsed.questions)) {
        console.error('Parsed response missing questions array:', parsed);
        throw new Error('Response missing questions array');
      }

      // Validate each question's format
      const invalidQuestions = parsed.questions.filter((q: { 
        question?: string; 
        answer?: string; 
        explanation?: string;
      }) => 
        !q.question || typeof q.question !== 'string' ||
        !q.answer || typeof q.answer !== 'string' ||
        !q.explanation || typeof q.explanation !== 'string'
      );

      if (invalidQuestions.length > 0) {
        console.error('Found invalid questions:', invalidQuestions);
        throw new Error('Some questions have invalid format');
      }

      generatedQuestions = parsed.questions;
      console.log('Successfully parsed and validated questions:', generatedQuestions);
    } catch (error: unknown) {
      console.error('Error processing AI response:', error);
      console.error('Raw AI response:', aiContent);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    /*
    // Create user questions from chat history with explanations
    console.log('Creating user questions from chat history...');
    const userQuestions = [];
    
    // Filter user messages with questions
    const userMessagesWithQuestions = chatMessages
      .filter(msg => msg.role === 'user' && msg.content.includes('?'));

    // Get bot responses for each user question
    for (const msg of userMessagesWithQuestions.slice(0, 5)) {
      // Find the bot's response to this question
      // Convert dates to numbers for comparison
      const msgTime = new Date(msg.createdAt).getTime();
      const botResponse = chatMessages.find(m => {
        const mTime = new Date(m.createdAt).getTime();
        return m.role === 'bot' && 
               m.chatId === msg.chatId && 
               mTime > msgTime;
      });

      // Extract answer from bot response
      const answer = botResponse ? extractAnswerFromResponse(botResponse.content) : null;
      
      if (answer) {
        userQuestions.push({
          question: msg.content,
          answer: answer,
          explanation: botResponse?.explanation || 
            'Essaie de résoudre ce problème en utilisant les mêmes techniques que dans les autres exercices.',
          fromChatId: msg.chatId,
          isUserQuestion: true
        });
      }
    }

    // Combine generated and user questions
    const allQuestions = [
      ...generatedQuestions,
      ...userQuestions
    ].slice(0, 10); // Ensure we have max 10 questions

    console.log('Created user questions:', userQuestions.length);
    console.log('Total questions:', allQuestions.length);
    */

    // Create new quiz
    console.log('Creating new quiz in database...');
    const quiz = await Quiz.create({
      userId,
      questions: generatedQuestions,
    });
    console.log('Quiz created successfully:', quiz._id);

    res.statusCode = 200;
    res.json?.(quiz) || res.end(JSON.stringify(quiz));

  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.statusCode = 500;
    res.json?.({ error: error instanceof Error ? error.message : 'An error occurred during quiz generation' }) || 
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred during quiz generation' }));
  }
};

interface QuizPluginConfig {
  mistralApiKey: string;
}

// Handler for updating quiz status
export const updateQuizHandler = async (req: RequestWithBody, res: ExpressStyleResponse) => {
  try {
    await connectDB();

    const userId = req.user?._id;
    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    const quizId = req.url?.split('/').pop();
    if (!quizId) {
      res.statusCode = 400;
      return res.json?.({ error: 'Quiz ID is required' }) || 
        res.end(JSON.stringify({ error: 'Quiz ID is required' }));
    }

    // Parse request body
    const body = req.body;
    if (!body || typeof body.completed !== 'boolean' || 
        typeof body.score !== 'number' || 
        !Array.isArray(body.questions)) {
      res.statusCode = 400;
      return res.json?.({ error: 'Invalid request body' }) || 
        res.end(JSON.stringify({ error: 'Invalid request body' }));
    }

    interface QuizQuestion {
      question: string;
      answer: string;
      explanation: string;
      isCorrect?: boolean;
    }

    // Calculate score based on correct answers
    const correctAnswers = body.questions.filter((q: QuizQuestion) => q.isCorrect).length;
    const totalQuestions = body.questions.length;

    // Update quiz with calculated score
    const quiz = await Quiz.findOneAndUpdate(
      { _id: quizId, userId },
      { 
        completed: body.completed,
        score: correctAnswers,
        totalQuestions 
      },
      { new: true }
    );

    if (!quiz) {
      res.statusCode = 404;
      return res.json?.({ error: 'Quiz not found' }) || 
        res.end(JSON.stringify({ error: 'Quiz not found' }));
    }

    res.statusCode = 200;
    res.json?.(quiz) || res.end(JSON.stringify(quiz));

  } catch (error) {
    console.error('Update Quiz Error:', error);
    res.statusCode = 500;
    res.json?.({ error: error instanceof Error ? error.message : 'An error occurred while updating quiz' }) || 
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred while updating quiz' }));
  }
};

export const viteQuizPlugin = (config: QuizPluginConfig): Plugin => {
  return {
    name: 'vite-quiz-plugin',
    configureServer(server: ViteDevServer) {
      const apiKey = config.mistralApiKey;
      if (!apiKey) {
        console.error('Warning: Mistral API key is not set in config');
      }

      // POST /api/quiz/generate - Create new quiz
      server.middlewares.use('/api/quiz/generate', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        if (req.method === 'POST') {
          try {
            await authMiddleware(req as AuthRequest, res as ExpressStyleResponse, async () => {
              await createQuizHandler({ apiKey })(req, res);
            });
          } catch (error) {
            console.error('Error in quiz middleware:', error);
            res.statusCode = 500;
            res.json?.({ error: 'Internal server error' }) || 
              res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });

      // PATCH /api/quiz/:id - Update quiz status
      server.middlewares.use('/api/quiz', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        if (req.method === 'PATCH') {
          try {
            // Parse the request body
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              try {
                req.body = JSON.parse(body);
                await authMiddleware(req as AuthRequest, res as ExpressStyleResponse, async () => {
                  await updateQuizHandler(req, res);
                });
              } catch (error) {
                console.error('Error parsing request body:', error);
                res.statusCode = 400;
                res.json?.({ error: 'Invalid request body' }) || 
                  res.end(JSON.stringify({ error: 'Invalid request body' }));
              }
            });
          } catch (error) {
            console.error('Error in quiz update middleware:', error);
            res.statusCode = 500;
            res.json?.({ error: 'Internal server error' }) || 
              res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        } else {
          next();
        }
      });
    }
  };
};
