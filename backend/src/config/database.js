
import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error(
      'MONGODB_URI is not configured. Copy backend/.env.example to backend/.env and set a database URL.'
    );
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });

  console.log('MongoDB connected');
}
