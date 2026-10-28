import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import api from './routes/api.js';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/errors.js';
import './services/notificationService.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: env.clientOrigin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  console.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  const origin = req.get('origin');
  if (['POST', 'PATCH', 'DELETE'].includes(req.method) && req.path.startsWith('/api/') && req.path !== '/api/auth/login' && req.path !== '/api/auth/register' && req.path !== '/api/auth/logout' && origin && origin !== env.clientOrigin) return res.status(403).json({ success: false, error: { code: 'INVALID_ORIGIN', message: 'Request origin is not allowed.' } });
  next();
});
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api', api);
app.use(notFound);
app.use(errorHandler);
