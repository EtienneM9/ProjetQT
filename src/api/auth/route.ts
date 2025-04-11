import type { Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import User from '../../lib/db/models/User';
import { authMiddleware, AuthRequest } from '../../lib/auth/middleware';
import type { JWTPayload } from '../../lib/auth/jwt';
import { type Plugin, type ViteDevServer, type Connect } from 'vite';

type ExpressStyleResponse = ServerResponse & {
  status?(code: number): ExpressStyleResponse;
  json?(data: any): void;
};

interface RequestWithBody extends IncomingMessage {
  body?: any;
}

// Register handler
async function handleRegister(req: RequestWithBody, res: ExpressStyleResponse) {
  try {
    const { connectDB } = await import('../../lib/db');
    await connectDB();
    
    const { email, password, name } = req.body || {};

    // Validate input
    if (!email || !password || !name) {
      res.statusCode = 400;
      return res.json?.({ error: 'Please provide all required fields' }) || 
        res.end(JSON.stringify({ error: 'Please provide all required fields' }));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.statusCode = 400;
      return res.json?.({ error: 'Email already registered' }) || 
        res.end(JSON.stringify({ error: 'Email already registered' }));
    }

    // Create new user
    const user = new User({ email, password, name });
    await user.save();

    // Generate token
    const { generateToken } = await import('../../lib/auth/jwt');
    const token = generateToken({ userId: user._id.toString(), email: user.email });

    // Return user data (excluding password) and token
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
    };

    res.statusCode = 201;
    res.json?.({ user: userData, token }) || 
      res.end(JSON.stringify({ user: userData, token }));
  } catch (error) {
    console.error('Register error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Registration failed' }) || 
      res.end(JSON.stringify({ error: 'Registration failed' }));
  }
}

// Login handler
async function handleLogin(req: RequestWithBody, res: ExpressStyleResponse) {
  try {
    const { connectDB } = await import('../../lib/db');
    await connectDB();

    const { email, password } = req.body || {};

    // Validate input
    if (!email || !password) {
      res.statusCode = 400;
      return res.json?.({ error: 'Please provide email and password' }) || 
        res.end(JSON.stringify({ error: 'Please provide email and password' }));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.statusCode = 401;
      return res.json?.({ error: 'Invalid credentials' }) || 
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.statusCode = 401;
      return res.json?.({ error: 'Invalid credentials' }) || 
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
    }

    // Generate token
    const { generateToken } = await import('../../lib/auth/jwt');
    const token = generateToken({ userId: user._id.toString(), email: user.email });

    // Return user data (excluding password) and token
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
    };

    res.statusCode = 200;
    res.json?.({ user: userData, token }) || 
      res.end(JSON.stringify({ user: userData, token }));
  } catch (error) {
    console.error('Login error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Login failed' }) || 
      res.end(JSON.stringify({ error: 'Login failed' }));
  }
}

// Get current user handler
async function handleGetMe(req: AuthRequest & RequestWithBody, res: ExpressStyleResponse) {
  try {
    const { connectDB } = await import('../../lib/db');
    await connectDB();

    const userId = req.user?._id;
    if (!userId) {
      res.statusCode = 401;
      return res.json?.({ error: 'Not authenticated' }) || 
        res.end(JSON.stringify({ error: 'Not authenticated' }));
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.statusCode = 404;
      return res.json?.({ error: 'User not found' }) || 
        res.end(JSON.stringify({ error: 'User not found' }));
    }

    res.statusCode = 200;
    res.json?.({ user }) || res.end(JSON.stringify({ user }));
  } catch (error) {
    console.error('Get me error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Failed to get user data' }) || 
      res.end(JSON.stringify({ error: 'Failed to get user data' }));
  }
}

// Vite plugin for auth routes
import { initializeConfig, AppConfig } from '../../lib/config';

export default function authPlugin(config: AppConfig): Plugin {
  // Initialize config with provided values
  initializeConfig(config);

  return {
    name: 'vite-auth-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/auth/register', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              req.body = JSON.parse(body);
              await handleRegister(req as RequestWithBody, res as ExpressStyleResponse);
            } catch (error) {
              console.error('Error parsing request body:', error);
              res.statusCode = 400;
              res.json?.({ error: 'Invalid request body' }) || 
                res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });

      server.middlewares.use('/api/auth/login', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              req.body = JSON.parse(body);
              await handleLogin(req as RequestWithBody, res as ExpressStyleResponse);
            } catch (error) {
              console.error('Error parsing request body:', error);
              res.statusCode = 400;
              res.json?.({ error: 'Invalid request body' }) || 
                res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });

      server.middlewares.use('/api/auth/me', async (req: RequestWithBody, res: ExpressStyleResponse, next: Connect.NextFunction) => {
        if (req.method === 'GET') {
          try {
            // Cast req and res to the correct types for authMiddleware
            const authReq = req as unknown as AuthRequest;
            
            await authMiddleware(authReq, res as ExpressStyleResponse, async () => {
              await handleGetMe(authReq as AuthRequest & RequestWithBody, res as ExpressStyleResponse);
            });
          } catch (error) {
            console.error('Error in /me route:', error);
            res.statusCode = 500;
            res.json?.({ error: 'Internal Server Error' }) || 
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
          }
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }
      });
    },
  };
}
