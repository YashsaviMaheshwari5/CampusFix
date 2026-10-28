import multer from 'multer';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import { open, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { AppError } from '../utils/AppError.js';
import { isAllowedImageSignature, isAllowedImageType, MAX_IMAGE_SIZE, MAX_IMAGE_FILES } from '../utils/imageValidation.js';
import { uploadDirectory } from '../utils/uploadDirectory.js';

const storage = multer.diskStorage({ destination: uploadDirectory, filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`) });
const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGE_FILES },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageType(file.originalname, file.mimetype)) return cb(null, true);
    return cb(new AppError('Upload a valid JPEG, PNG, GIF, or WebP image.', 400, 'INVALID_FILE_TYPE'));
  },
});

async function removePartialUploads(files = []) {
  await Promise.allSettled(files.map((file) => unlink(file.path)));
}

export function complaintImages(req, res, next) {
  upload.array('attachments', 3)(req, res, async (error) => {
    if (error) { await removePartialUploads(req.files); return next(error); }
    try {
      for (const file of req.files || []) {
        const handle = await open(file.path, 'r');
        const header = Buffer.alloc(12);
        try { await handle.read(header, 0, header.length, 0); }
        finally { await handle.close(); }
        if (!isAllowedImageSignature(header, file.mimetype)) throw new AppError('The uploaded file content does not match a supported image type.', 400, 'INVALID_FILE_TYPE');
      }
      next();
    } catch (validationError) {
      await removePartialUploads(req.files);
      next(validationError);
    }
  });
}
