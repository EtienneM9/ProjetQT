import type { Request, Response } from 'express';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import MistralClient from '@mistralai/mistralai';
import { connectDB } from '../../lib/db';
import Chat from '../../lib/db/models/Chat';
import Message from '../../lib/db/models/Message';
import { authMiddleware, AuthRequest } from '../../lib/auth/middleware';
import type { Connect } from 'vite';

// System messages for different phases
const SYSTEM_MESSAGES = {
  default: `You are an educational assistant specialized in mathematics, dedicated to 8-year-old autistic children.  
Explain mathematical concepts in a very simple way, using visual descriptions and concrete examples from everyday life.  
Break down each problem into small, numbered steps that are easy to understand. Avoid complex metaphors. Be patient, encouraging, and reassuring.  
After each explanation, ask a simple question to check the child's understanding. Structure your responses in a clear and predictable manner.

[IMPORTANT] **Format your answers using the following format:**
[IMPORTANT] **If the user's message is a casual conversation that does not include a math probleme, put all your message in "quickrep" and an empty string in "explication" and remind the user that you are here to help learn math**
[CRUCIAL] **I want nothing else but the JSON below, with no additional text outside:**

\`\`\`json
{
    "quickrep": "short answer (example: '4 * 9 = 36')",
    "explication": "detailed explanation of the reasoning, with numbered steps and visual descriptions"
}
\`\`\`
`
};

// Utility functions
function tryParseJSON(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start === -1 || end === 0) return null;
    
    const jsonPart = text.slice(start, end);
    return JSON.parse(jsonPart);
  } catch (error) {
    console.log('Not a valid JSON:', error);
    return null;
  }
}

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

export const createChatHandler = (options: HandlerOptions) => async (req: RequestWithBody, res: ExpressStyleResponse) => {
  try {
    const { apiKey } = options;
    if (!apiKey) {
      res.statusCode = 500;
      return res.json?.({ error: 'API key is required' }) || 
        res.end(JSON.stringify({ error: 'API key is required' }));
    }
    
    await connectDB();
    
    // Initialize MistralClient
    const client = new MistralClient(apiKey);

    const { messages, chatId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    // Get or create chat
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        res.statusCode = 404;
        return res.json?.({ error: 'Chat not found' }) || 
          res.end(JSON.stringify({ error: 'Chat not found' }));
      }
    } else {
      chat = await Chat.create({
        userId,
        title: messages[0]?.content?.slice(0, 50) + '...' || 'New Chat',
      });
    }
    
    // Include system message
    const messageHistory = [
      {
        role: "system" as const,
        content: SYSTEM_MESSAGES.default
      },
      ...messages
    ];

    // Call Mistral API
    const chatResponse = await client.chat({
      model: "mistral-medium",
      messages: messageHistory
    });

    // Validate and format response
    if (!chatResponse.choices || !chatResponse.choices[0]?.message?.content || typeof chatResponse.choices[0].message.content !== 'string') {
      throw new Error('Invalid response from Mistral API');
    }
    
    const aiResponse = chatResponse.choices[0].message.content;
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format");
    }

    const jsonContent = jsonMatch[1].trim();
    let parsedResponse;
    console.log('Raw AI response:', aiResponse);
    console.log('Extracted JSON content:', jsonContent);
    try {
      parsedResponse = JSON.parse(jsonContent);
      if (!parsedResponse.quickrep || !parsedResponse.explication) {
        throw new Error("Missing required fields in response");
      }
      console.log('Parsed AI response:', parsedResponse);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error("Invalid response format from AI");
    }

    // Store user message
    await Message.create({
      chatId: chat._id,
      role: 'user',
      content: messages[messages.length - 1].content,
    });

    // Store AI response
    await Message.create({
      chatId: chat._id,
      role: 'bot',
      content: parsedResponse.quickrep,
      explanation: parsedResponse.explication,
    });

    // Update chat's lastMessage
    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: parsedResponse.quickrep,
      updatedAt: new Date(),
    });

    // Return response
    res.statusCode = 200;
    res.json?.({
      choices: [{
        message: {
          role: 'assistant',
          content: parsedResponse
        },
        index: 0,
        finish_reason: chatResponse.choices[0].finish_reason
      }],
      chatId: chat._id
    }) || res.end(JSON.stringify({
      choices: [{
        message: {
          role: 'assistant',
          content: parsedResponse
        },
        index: 0,
        finish_reason: chatResponse.choices[0].finish_reason
      }],
      chatId: chat._id
    }));
  } catch (error) {
    console.error('Chat API Error:', error);
    res.statusCode = 500;
    res.json?.({ error: error instanceof Error ? error.message : 'An error occurred during chat processing' }) || 
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred during chat processing' }));
  }
};

// Vite plugin for routing
interface ChatPluginConfig {
  mistralApiKey: string;
}

export const viteChatPlugin = (config: ChatPluginConfig): Plugin => {
  return {
    name: 'vite-chat-plugin',
    configureServer(server: ViteDevServer) {
      // Get API key from config
      const apiKey = config.mistralApiKey;
      if (!apiKey) {
        console.error('Warning: Mistral API key is not set in config');
      }

      server.middlewares.use('/api/chat', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        if (req.method === 'POST') {
          try {
            // Apply auth middleware
            await authMiddleware(req as AuthRequest, res as ExpressStyleResponse, async () => {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                try {
                  req.body = JSON.parse(body);
                  await createChatHandler({ apiKey })(req, res);
                } catch (error) {
                  console.error('Error parsing request body:', error);
                  res.statusCode = 400;
                  res.json?.({ error: 'Invalid request body' }) || 
                    res.end(JSON.stringify({ error: 'Invalid request body' }));
                }
              });
            });
          } catch (error) {
            console.error('Error in chat middleware:', error);
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
