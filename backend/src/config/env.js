// Environment variables deployment-specific config/secrets rakhte hain; dotenv local .env ko process.env me load karta hai.
// process global Node object hai; JWT secret, database URL, port aur frontend origin yahan se read hote hain.
import dotenv from 'dotenv';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  allowedOrigins: (process.env.CLIENT_ORIGINS || `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'},http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174`).split(',').map((s) => s.trim()),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
};
