import type { Request } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import User from '../db/models/User';
import type { JWTPayload } from './jwt';

export type ExpressStyleResponse = ServerResponse & {
  json?(data: any): void;
};

export interface AuthRequest extends IncomingMessage {
  user?: {
    _id: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: ExpressStyleResponse,
  next: () => void
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.statusCode = 401;
      return res.json?.({ error: 'No token provided' }) || 
        res.end(JSON.stringify({ error: 'No token provided' }));
    }

    const token = authHeader.split(' ')[1];
    const { verifyToken } = await import('./jwt');
    const payload = verifyToken(token);

    if (!payload) {
      res.statusCode = 401;
      return res.json?.({ error: 'Invalid token' }) || 
        res.end(JSON.stringify({ error: 'Invalid token' }));
    }

    const { connectDB } = await import('../db');
    await connectDB();
    const user = await User.findById(payload.userId).select('-password');
    
    if (!user) {
      res.statusCode = 401;
      return res.json?.({ error: 'User not found' }) || 
        res.end(JSON.stringify({ error: 'User not found' }));
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.statusCode = 500;
    res.json?.({ error: 'Authentication error' }) || 
      res.end(JSON.stringify({ error: 'Authentication error' }));
  }
};
