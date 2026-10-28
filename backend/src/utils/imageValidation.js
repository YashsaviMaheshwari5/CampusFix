import { Buffer } from 'node:buffer';

const signatures = {
  'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/gif': (bytes) => ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii')),
  'image/webp': (bytes) => bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP',
};
const extensionsByMime = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/gif': ['.gif'], 'image/webp': ['.webp'] };

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGE_FILES = 3;

export function isAllowedImageType(filename, mimeType) {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return Boolean(extensionsByMime[mimeType]?.includes(extension));
}

export function isAllowedImageSignature(bytes, mimeType) {
  return Boolean(signatures[mimeType]?.(bytes));
}
