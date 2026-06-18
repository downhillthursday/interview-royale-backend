import { Request, Response, NextFunction } from 'express';

export interface NormalizedInterviewConfig {
  interviewFocus: string;
  technology: string;
  role: string;
  keyFocusArea: string;
  difficulty: string;
  userId?: string;
}

export const normalizeInterviewConfig = (body: any = {}): NormalizedInterviewConfig => {
  const interviewFocus = String(body.interviewFocus ?? body.jobRole ?? body.role ?? '').trim();
  const technology = String(body.technology ?? body.keyFocus ?? body.keyFocusArea ?? '').trim();

  return {
    interviewFocus,
    technology,
    role: interviewFocus,
    keyFocusArea: technology,
    difficulty: String(body.difficulty ?? 'Intermediate').trim() || 'Intermediate',
    userId: body.userId,
  };
};

export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

export const formatResponse = (data: any) => {
  return {
    success: true,
    data,
  };
};