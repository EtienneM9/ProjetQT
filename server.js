import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authPlugin from './src/api/auth/route.js';
import { viteChatPlugin } from './src/api/chat/route.js';
import { viteQuizPlugin } from './src/api/quiz/route.js';
import { quizzesPlugin } from './src/api/quizzes/route.js';
import chatsPlugin from './src/api/chats/route.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware
app.use(express.json());

// Config object for plugins
const config = {
  mongoUri: process.env.VITE_MONGO_CONNECTION_STRING,
  jwtSecret: process.env.VITE_JWT_SECRET,
  mistralApiKey: process.env.VITE_MISTRAL_API_KEY,
  serverPort: port,
  serverHost: process.env.HOST || 'localhost'
};

// Configure routes by extracting the middleware from the plugins
app.use('/api/auth', authPlugin(config).configureMiddleware());
app.use('/api/chat', viteChatPlugin({ mistralApiKey: process.env.VITE_MISTRAL_API_KEY }).configureMiddleware());
app.use('/api/quiz', viteQuizPlugin({ mistralApiKey: process.env.VITE_MISTRAL_API_KEY }).configureMiddleware());
app.use('/api/quizzes', quizzesPlugin().configureMiddleware());
app.use('/api/chats', chatsPlugin().configureMiddleware());

// Connect to MongoDB
mongoose.connect(process.env.VITE_MONGO_CONNECTION_STRING)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Backend server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
