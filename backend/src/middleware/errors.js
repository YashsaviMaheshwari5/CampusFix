import multer from 'multer';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export function notFound(req, _res, next) { next(new AppError(`Route ${req.method} ${req.originalUrl} was not found.`, 404, 'NOT_FOUND')); }
export function errorHandler(error, _req, res, _next) {
  void _next;
  let err = error;
  if (error.type === 'entity.parse.failed') err = new AppError('Request body contains invalid JSON.', 400, 'INVALID_JSON');
  if (error.type === 'entity.too.large') err = new AppError('Request body is too large.', 413, 'PAYLOAD_TOO_LARGE');
  if (error instanceof mongoose.Error.ValidationError) err = new AppError(Object.values(error.errors).map((item) => item.message).join(' '), 400, 'VALIDATION_ERROR');
  if (error instanceof mongoose.Error.CastError) err = new AppError('The requested record ID is invalid.', 400, 'INVALID_ID');
  if (error.code === 11000) err = new AppError('An account with this email already exists.', 409, 'DUPLICATE');
  if (error instanceof multer.MulterError) err = new AppError(error.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller.' : 'The uploaded file could not be accepted.', 400, 'UPLOAD_ERROR');
  const status = err.statusCode || 500;
  if (status >= 500) console.error(error);
  if (res.headersSent) return res.end();
  res.status(status).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: status >= 500 ? 'Something went wrong. Please try again.' : err.message } });
}
