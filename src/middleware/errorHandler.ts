import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  const sendClientError = (status: number, message: string) => {
    return res.status(status).json({ error: message });
  };

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendClientError(413, 'File too large. Maximum resume size is 5MB.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendClientError(400, 'Unexpected file field.');
    }
    return sendClientError(400, 'Invalid file upload.');
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return sendClientError(400, 'Invalid JSON payload.');
  }
  if (err?.type === 'entity.too.large') {
    return sendClientError(413, 'Request body is too large.');
  }
  if (err?.message?.includes('Only PDF') || err?.message?.includes('valid PDF resumes')) {
    return sendClientError(400, 'Only valid PDF resumes are allowed.');
  }
  if (err?.message?.includes('Only image')) {
    return sendClientError(400, 'Only image files are allowed for profile photos.');
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export default errorHandler;