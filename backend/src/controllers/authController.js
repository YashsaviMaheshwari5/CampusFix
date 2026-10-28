import User from '../models/User.js';
import Session from '../models/Session.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { createSessionToken, hashSessionId, sessionCookieOptions } from '../utils/session.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, preferences: user.preferences });
async function issueToken(user, res) {
  const tokenSession = createSessionToken(user, env.jwtSecret, env.jwtExpiresIn);
  await Session.create({ user: user._id, tokenIdHash: hashSessionId(tokenSession.tokenId), expiresAt: tokenSession.expiresAt });
  res.cookie('campusfix_token', tokenSession.token, sessionCookieOptions(env.cookieSecure, env.jwtExpiresIn));
}

export async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100 || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8 || password.length > 128) throw new AppError('Enter a valid name and email. Password must be 8–128 characters.', 400, 'VALIDATION_ERROR');
  if (await User.exists({ email: email.trim().toLowerCase() })) throw new AppError('An account with this email already exists.', 409, 'DUPLICATE');
  const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash: await hashPassword(password) });
  await issueToken(user, res);
  res.status(201).json({ success: true, data: { user: publicUser(user) } });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') throw new AppError('Enter your email and password.', 400, 'VALIDATION_ERROR');
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !await verifyPassword(password, user.passwordHash)) throw new AppError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS');
  await issueToken(user, res);
  res.json({ success: true, data: { user: publicUser(user) } });
}
export async function me(req, res) { res.json({ success: true, data: { user: publicUser(req.user) } }); }
export async function updatePreferences(req, res) {
  const { name, email, notifications } = req.body || {};
  if (name === undefined && email === undefined && notifications === undefined) throw new AppError('Provide at least one profile or preference value.', 400, 'VALIDATION_ERROR');
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) throw new AppError('Name must contain 2–100 characters.', 400, 'VALIDATION_ERROR');
    req.user.name = name.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) throw new AppError('Enter a valid email address.', 400, 'VALIDATION_ERROR');
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail, _id: { $ne: req.user._id } })) throw new AppError('An account with this email already exists.', 409, 'DUPLICATE');
    req.user.email = normalizedEmail;
  }
  if (notifications !== undefined) {
    if (typeof notifications !== 'boolean') throw new AppError('Notification preference must be true or false.', 400, 'VALIDATION_ERROR');
    req.user.set('preferences.notifications', notifications);
  }
  await req.user.save();
  res.json({ success: true, data: { user: publicUser(req.user) } });
}
export async function logout(req, res) {
  await Session.updateOne({ _id: req.authSession._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  res.clearCookie('campusfix_token', sessionCookieOptions(env.cookieSecure, env.jwtExpiresIn));
  res.json({ success: true, data: { message: 'Signed out.' } });
}
