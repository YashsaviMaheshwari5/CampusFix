import mongoose from 'mongoose';
import process from 'node:process';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { durationMilliseconds } from './utils/session.js';

try {
  if (env.jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters. Set it in backend/.env.');
  durationMilliseconds(env.jwtExpiresIn);
  let retryTimer;
  try {
    await connectDatabase();
    try {
      const User = (await import('./models/User.js')).default;
      const { hashPassword } = await import('./utils/password.js');
      if (!await User.exists({ email: 'staff@campusfix.edu' })) {
        await User.create({
          name: 'Campus Staff Coordinator',
          email: 'staff@campusfix.edu',
          passwordHash: await hashPassword('password123'),
          role: 'staff',
        });
      }
      if (!await User.exists({ email: 'student@campusfix.edu' })) {
        await User.create({
          name: 'Demo Student',
          email: 'student@campusfix.edu',
          passwordHash: await hashPassword('password123'),
          role: 'student',
        });
      }
    } catch {
      // Ignore seeding errors in transient or mock environments
    }
  }
  catch (error) {
    console.error(`MongoDB is unavailable: ${error.message}`);
    console.error('The API will start, but database routes will be unavailable until MongoDB connects.');
    if (env.mongoUri) {
      retryTimer = setInterval(() => connectDatabase().then(() => clearInterval(retryTimer)).catch((retryError) => console.error(`MongoDB reconnect attempt failed: ${retryError.message}`)), 10000);
      retryTimer.unref();
    }
  }
  const server = app.listen(env.port, () => console.log(`CampusFix API listening on http://localhost:${env.port}`));
  const shutdown = async (signal) => { console.log(`${signal} received; shutting down`); clearInterval(retryTimer); server.close(async () => { await mongoose.disconnect(); process.exit(0); }); };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
}
