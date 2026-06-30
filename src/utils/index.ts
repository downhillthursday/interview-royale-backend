import { Request, Response, NextFunction } from 'express';

export interface NormalizedInterviewConfig {
  interviewFocus: string;
  technology: string;
  role: string;
  keyFocusArea: string;
  difficulty: string;
  numberOfQuestions: number;
  userId?: string;
}

const DEFAULT_NUMBER_OF_QUESTIONS = 5;
const MIN_NUMBER_OF_QUESTIONS = 2;
const MAX_NUMBER_OF_QUESTIONS = 10;

const normalizeNumberOfQuestions = (value: any): number => {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_NUMBER_OF_QUESTIONS;
  }

  const parsedValue = typeof value === 'number' ? value : Number(String(value).trim());

  if (!Number.isInteger(parsedValue)) {
    return DEFAULT_NUMBER_OF_QUESTIONS;
  }

  return Math.min(MAX_NUMBER_OF_QUESTIONS, Math.max(MIN_NUMBER_OF_QUESTIONS, parsedValue));
};

export const normalizeInterviewConfig = (body: any = {}): NormalizedInterviewConfig => {
  const interviewFocus = String(body.interviewFocus ?? body.jobRole ?? body.role ?? '').trim();
  const technology = String(body.technology ?? body.keyFocus ?? body.keyFocusArea ?? '').trim();

  return {
    interviewFocus,
    technology,
    role: interviewFocus,
    keyFocusArea: technology,
    difficulty: String(body.difficulty ?? 'Intermediate').trim() || 'Intermediate',
    numberOfQuestions: normalizeNumberOfQuestions(body.numberOfQuestions),
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