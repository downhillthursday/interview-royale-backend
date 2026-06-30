import { Router, type Request, type Response } from 'express';

export const setHealthRoutes = (apiRouter: Router) => {
  apiRouter.get('/health', (_: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      message: 'Backend is running',
      timestamp: new Date().toISOString()
    });
  });
};