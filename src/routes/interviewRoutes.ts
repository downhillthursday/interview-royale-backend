import { Router } from 'express';
import InterviewController from '../controllers/interviewController';
import { groqRateLimiter } from '../middleware/rateLimiter';
import { authenticateUser } from '../middleware/authenticate';

const interviewController = new InterviewController();

export const setInterviewRoutes = (app: Router) => {
  app.post(
    '/interviews/start',
    authenticateUser,
    groqRateLimiter,
    interviewController.startInterview.bind(interviewController)
  );

  app.post(
    '/interviews/respond',
    authenticateUser,
    interviewController.respondInterview.bind(interviewController)
  );
};