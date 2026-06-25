import { Request, Response, NextFunction } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    // It will automatically use GOOGLE_APPLICATION_CREDENTIALS if set,
    // or just the default config. To verify tokens, usually just initializing is enough,
    // but a projectId might be needed if not present in the token. We can let it use the default.
    projectId: process.env.FIREBASE_PROJECT_ID || 'interview-royale'
  });
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required. Bearer token missing.' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authorization token not found' });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = { uid: decodedToken.uid };
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
