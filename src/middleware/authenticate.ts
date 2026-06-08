import { Request, Response, NextFunction } from 'express';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const xUserIdHeader = req.headers['x-user-id'];
  
  if (!authHeader && !xUserIdHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  (req as any).user = { userId };
  next();
};
