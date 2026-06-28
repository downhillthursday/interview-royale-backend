import { Router } from 'express';
import sessionController from '../controllers/sessionController';
import { groqRateLimiter } from '../middleware/rateLimiter';

export const setSessionRoutes = (app: Router) => {
  app.post('/interview-sessions', sessionController.createSession.bind(sessionController));
  app.get('/interview-sessions/:id', sessionController.getSession.bind(sessionController));
  app.get('/interview-sessions/user/:userId', sessionController.getUserSessions.bind(sessionController));
  app.patch('/interview-sessions/:id/complete', groqRateLimiter, sessionController.completeSession.bind(sessionController));
};
