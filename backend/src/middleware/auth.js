import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { hashSessionId } from '../utils/session.js';

export async function requireAuth(req, _res, next) {
  let payload;
  try {
    const token = req.cookies?.campusfix_token;
    if (!token) throw new AppError('Please sign in to continue.', 401, 'UNAUTHENTICATED');
    payload = jwt.verify(token, env.jwtSecret);
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') throw new AppError('Your session has expired. Please sign in again.', 401, 'UNAUTHENTICATED');
  } catch (error) { return next(error instanceof AppError ? error : new AppError('Your session has expired. Please sign in again.', 401, 'UNAUTHENTICATED')); }

  try {
    const [user, session] = await Promise.all([
      User.findById(payload.sub).select('name email role preferences'),
      Session.findOne({ tokenIdHash: hashSessionId(payload.jti), user: payload.sub, revokedAt: null, expiresAt: { $gt: new Date() } }),
    ]);
    if (!user || !session) return next(new AppError('Your session has expired or has been revoked. Please sign in again.', 401, 'UNAUTHENTICATED'));
    req.user = user;
    req.authSession = session;
    return next();
  } catch (error) { return next(error); }
}

export const allowRoles = (...roles) => (req, _res, next) => roles.includes(req.user.role) ? next() : next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
