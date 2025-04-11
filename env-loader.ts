import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const getEnvVariable = (key: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    console.error(`Environment variable ${key} is not defined`);
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};