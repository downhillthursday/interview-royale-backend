import { Request, Response, NextFunction } from 'express';

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