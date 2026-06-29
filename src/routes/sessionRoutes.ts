import { Router } from 'express';
import sessionController from '../controllers/sessionController';
import { authenticateUser } from '../middleware/authenticate';
import { groqRateLimiter } from '../middleware/rateLimiter';

export const setSessionRoutes = (app: Router) => {
  app.post('/interview-sessions', authenticateUser, sessionController.createSession.bind(sessionController));
  app.get('/interview-sessions/:id', authenticateUser, sessionController.getSession.bind(sessionController));
  app.get('/interview-sessions/user/:userId', authenticateUser, sessionController.getUserSessions.bind(sessionController));
  app.patch('/interview-sessions/:id/complete', authenticateUser, groqRateLimiter, sessionController.completeSession.bind(sessionController));
};
