import mongoose from 'mongoose';
import { getMongoUri } from '../config';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  const mongoUri = getMongoUri();
  console.log('MongoDB URI loaded successfully');

  try {
    const db = await mongoose.connect(mongoUri);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export function getConnectionStatus() {
  return isConnected;
}
