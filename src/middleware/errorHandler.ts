import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack || err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum resume size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  if (err?.message?.includes('Only PDF') || err?.message?.includes('Only image') || err?.message?.includes('valid PDF resumes')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: err.message,
  });
};

export default errorHandler;