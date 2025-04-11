import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteChatPlugin } from './src/api/chat/route';
import { viteQuizPlugin } from './src/api/quiz/route';
import { quizzesPlugin } from './src/api/quizzes/route';
import authPlugin from './src/api/auth/route';
import chatsPlugin from './src/api/chats/route';
import type { ConfigEnv, UserConfig } from 'vite';

export default ({ command, mode }: ConfigEnv): UserConfig => {
  // Load env with all prefixes to ensure we capture everything
  const env = loadEnv(mode, process.cwd(), ['VITE_', '']);
  console.log('Loaded environment variables:', {
    hasMongoUri: Boolean(env.VITE_MONGO_CONNECTION_STRING),
    hasJwtSecret: Boolean(env.VITE_JWT_SECRET),
    hasMistralKey: Boolean(env.VITE_MISTRAL_API_KEY),
    serverPort: env.VITE_SERVER_PORT,
    serverHost: env.VITE_SERVER_HOST
  });

  const serverPort = env.VITE_SERVER_PORT || '5173';
  const serverHost = env.VITE_SERVER_HOST || 'localhost';

  // Create config object for auth plugin
  const config = {
    mongoUri: env.VITE_MONGO_CONNECTION_STRING,
    jwtSecret: env.VITE_JWT_SECRET,
    mistralApiKey: env.VITE_MISTRAL_API_KEY,
    serverPort,
    serverHost
  };

  console.log('Initializing Vite with config:', config);

  return defineConfig({
    plugins: [
      react(),
      viteChatPlugin({ mistralApiKey: env.VITE_MISTRAL_API_KEY }),
      viteQuizPlugin({ mistralApiKey: env.VITE_MISTRAL_API_KEY }),
      quizzesPlugin(),
      authPlugin(config),
      chatsPlugin(),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    envDir: '.',
    build: {
      sourcemap: true
    },
    server: {
      host: true,
      port: parseInt(serverPort),
      proxy: {
        '/api': {
          target: `http://${serverHost}:${serverPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    }
  });
};
