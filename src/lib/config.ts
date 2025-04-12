// Configuration types
export interface AppConfig {
  mongoUri?: string;
  jwtSecret?: string;
  serverPort?: string;
  serverHost?: string;
  mistralApiKey?: string;
  apiUrl?: string;
}

// Global configuration state
let runtimeConfig: AppConfig = {};

// Initialize configuration with runtime values
export function initializeConfig(config: AppConfig) {
  console.log('Initializing config with:', config);
  runtimeConfig = config;
  
  // Validate essential configurations
  console.log('Current runtime config state:', {
    mongoUri: Boolean(runtimeConfig.mongoUri),
    jwtSecret: Boolean(runtimeConfig.jwtSecret),
    mistralApiKey: Boolean(runtimeConfig.mistralApiKey),
    serverPort: runtimeConfig.serverPort,
    serverHost: runtimeConfig.serverHost
  });
}

// Get MongoDB URI with fallback to environment variables
export function getMongoUri(): string {
  console.log('Getting MongoDB URI...');
  const uri = runtimeConfig.mongoUri || import.meta.env.VITE_MONGO_CONNECTION_STRING;
  if (!uri) {
    console.error('Config state:', { runtime: runtimeConfig, env: import.meta.env });
    throw new Error('MongoDB connection string is not defined');
  }
  return uri;
}

// Get JWT secret with fallback to environment variables
export function getJwtSecret(): string {
  const secret = runtimeConfig.jwtSecret || import.meta.env.VITE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret is not defined');
  }
  return secret;
}

// Get Mistral API key
export function getMistralApiKey(): string {
  const key = runtimeConfig.mistralApiKey || import.meta.env.VITE_MISTRAL_API_KEY;
  if (!key) {
    throw new Error('Mistral API key is not defined');
  }
  return key;
}

// Get server configuration with fallbacks
export function getServerConfig() {
  return {
    port: parseInt(runtimeConfig.serverPort || import.meta.env.VITE_SERVER_PORT || '5173'),
    host: runtimeConfig.serverHost || import.meta.env.VITE_SERVER_HOST || 'localhost'
  };
}

// Get API URL with fallback
export function getApiUrl(): string {
  // In production, use the actual backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://your-backend-url.com';
  }
  
  // In development, use localhost with the correct port
  const { port, host } = getServerConfig();
  return `http://${host}:${port}`;
}
