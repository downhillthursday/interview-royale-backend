import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

export const RESUME_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const RESUME_STORAGE_DIR = path.join(__dirname, '../../private_uploads/resumes');

const invalidFileNameChars = /[\0<>:"/\\|?*\x00-\x1F]/g;

export const sanitizeFileName = (fileName: string): string => {
  const baseName = path.basename(fileName || 'resume.pdf').trim();
  const cleaned = baseName.replace(invalidFileNameChars, '_').replace(/\s+/g, ' ');
  return cleaned || 'resume.pdf';
};

export const isPdfBuffer = (buffer: Buffer): boolean => {
  return buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';
};

export const buildStoredResumeName = (): string => `${crypto.randomUUID()}.pdf`;

export const ensureResumeStorageDir = async (): Promise<void> => {
  await fs.mkdir(RESUME_STORAGE_DIR, { recursive: true });
};

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: RESUME_MAX_SIZE_BYTES,
  },
  fileFilter: (_req, _file, cb) => {
    cb(null, true);
  },
});

export const resumeUploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many resume uploads. Please try again later.' },
});