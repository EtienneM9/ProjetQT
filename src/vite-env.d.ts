/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JWT_SECRET: string;
  readonly VITE_MISTRAL_API_KEY: string;
  readonly VITE_MONGO_CONNECTION_STRING: string;
  readonly VITE_SERVER_PORT: string;
  readonly VITE_SERVER_HOST: string;
  readonly VITE_ENABLE_VOICE_SYNTHESIS: string;
  readonly VITE_ENABLE_VOICE_RECOGNITION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
