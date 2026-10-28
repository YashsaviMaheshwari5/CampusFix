import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'node:crypto';

export function durationMilliseconds(expiresIn) {
  const match = /^(\d+)(s|m|h|d)$/.exec(expiresIn);
  if (!match) throw new Error('JWT_EXPIRES_IN must use a duration such as 30m, 12h, or 1d.');
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  const duration = Number(match[1]) * unitMs;
  if (!Number.isSafeInteger(duration) || duration < 60_000 || duration > 30 * 86_400_000) throw new Error('JWT_EXPIRES_IN must be between 1 minute and 30 days.');
  return duration;
}

export function createSessionToken(user, secret, expiresIn) {
  const jti = randomUUID();
  const token = jwt.sign({ sub: user._id.toString(), role: user.role, jti }, secret, { expiresIn });
  const { exp } = jwt.decode(token);
  return { token, tokenId: jti, expiresAt: new Date(exp * 1000) };
}

export function hashSessionId(tokenId) {
  return createHash('sha256').update(tokenId).digest('hex');
}

export function sessionCookieOptions(secure, expiresIn = '1d') {
  return { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: durationMilliseconds(expiresIn) };
}
