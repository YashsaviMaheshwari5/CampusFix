import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const defaultDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url));
export const uploadDirectory = path.resolve(process.env.CAMPUSFIX_UPLOAD_DIR || defaultDirectory);
