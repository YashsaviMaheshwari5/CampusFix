
// Mongoose MongoDB driver/ODM hai: connectDatabase async network I/O ke zariye configured database se connect karta hai.
// MongoDB Atlas bhi MongoDB hi hai, bas hosted service; MONGODB_URI se local ya Atlas connection select hota hai.
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
