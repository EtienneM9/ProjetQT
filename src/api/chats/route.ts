import type { Plugin, ViteDevServer, Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { connectDB } from '../../lib/db';
import Chat from '../../lib/db/models/Chat';
import Message from '../../lib/db/models/Message';
import { authMiddleware, AuthRequest } from '../../lib/auth/middleware';

type ExpressStyleResponse = ServerResponse & {
  status?(code: number): ExpressStyleResponse;
  json?(data: any): void;
};

interface RequestWithBody extends IncomingMessage {
  body?: any;
  user?: { _id: string };
}

// Get chat by userId and chatId
async function getChatById(req: RequestWithBody, res: ExpressStyleResponse, chatId: string, userId: string) {
  try {
    await connectDB();
    
    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    const chat = await Chat.findOne({ _id: chatId, userId: userId })
      .select('title lastMessage createdAt updatedAt');

    if (!chat) {
      res.statusCode = 404;
      return res.json?.({ error: 'Chat not found' }) || 
        res.end(JSON.stringify({ error: 'Chat not found' }));
    }

    res.statusCode = 200;
    res.json?.({ chat }) || res.end(JSON.stringify({ chat }));

  } catch (error) {
    console.error('Get chat by id error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Failed to get chat' }) || 
      res.end(JSON.stringify({ error: 'Failed to get chat' }));
  }

}

// Get all chats for the current user
async function handleGetChats(req: RequestWithBody, res: ExpressStyleResponse) {
  try {
    await connectDB();
    const userId = req.user?._id;

    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title lastMessage createdAt updatedAt');

    res.statusCode = 200;
    res.json?.({ chats }) || res.end(JSON.stringify({ chats }));
  } catch (error) {
    console.error('Get chats error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Failed to get chats' }) || 
      res.end(JSON.stringify({ error: 'Failed to get chats' }));
  }
}

// Get chat messages
async function handleGetMessages(req: RequestWithBody, res: ExpressStyleResponse, chatId: string) {
  try {
    await connectDB();
    const userId = req.user?._id;

    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    // Verify chat belongs to user
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      res.statusCode = 404;
      return res.json?.({ error: 'Chat not found' }) || 
        res.end(JSON.stringify({ error: 'Chat not found' }));
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .select('role content explanation createdAt');

    res.statusCode = 200;
    res.json?.({ messages, chat }) || res.end(JSON.stringify({ messages, chat }));
  } catch (error) {
    console.error('Get messages error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Failed to get messages' }) || 
      res.end(JSON.stringify({ error: 'Failed to get messages' }));
  }
}

// Delete chat
async function handleDeleteChat(req: RequestWithBody, res: ExpressStyleResponse, chatId: string) {
  try {
    await connectDB();
    const userId = req.user?._id;

    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Unauthorized' }) || 
        res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    // Verify and delete chat
    const chat = await Chat.findOneAndDelete({ _id: chatId, userId });
    if (!chat) {
      res.statusCode = 404;
      return res.json?.({ error: 'Chat not found' }) || 
        res.end(JSON.stringify({ error: 'Chat not found' }));
    }

    // Delete all messages
    await Message.deleteMany({ chatId });

    res.statusCode = 200;
    res.json?.({ success: true }) || res.end(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Delete chat error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Failed to delete chat' }) || 
      res.end(JSON.stringify({ error: 'Failed to delete chat' }));
  }
}

// Vite plugin for chat management routes
export default function chatsPlugin(): Plugin {
  return {
    name: 'vite-chats-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/chats', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        try {
          // Apply auth middleware
          await authMiddleware(req as AuthRequest, res as ExpressStyleResponse, async () => {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const pathname = url.pathname.replace(/^\/api\/chats\/?/, '');
            const parts = pathname.split('/').filter(Boolean);
            console.log('URL parts:', parts); // Debug log

            if (req.method === 'GET') {
              if (parts.length === 0) {
                // GET /api/chats
                await handleGetChats(req, res);
              } else if (parts.length === 1) {
                // GET /api/chats/:chatId
                await handleGetMessages(req, res, parts[0]);
              } else if (parts.length === 2) {
                if (parts[1] === 'details') {
                  // GET /api/chats/:chatId/details
                  await getChatById(req, res, parts[0], req.user?._id || '');
                } else if (parts[1] === 'messages') {
                  // GET /api/chats/:chatId/messages
                  await handleGetMessages(req, res, parts[0]);
                } else {
                  res.statusCode = 404;
                  res.end('Not Found');
                }
              } else {
                res.statusCode = 404;
                res.end('Not Found');
              }
            } else if (req.method === 'DELETE' && parts.length === 1) {
              // DELETE /api/chats/:chatId
              await handleDeleteChat(req, res, parts[0]);
            } else {
              res.statusCode = 405;
              res.end('Method Not Allowed');
            }
          });
        } catch (error) {
          console.error('Chats API Error:', error);
          res.statusCode = 500;
          res.json?.({ error: 'Internal server error' }) || 
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    }
  };
}
