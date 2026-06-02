import { Router } from 'express';
import InterviewController from '../controllers/interviewController';

const interviewController = new InterviewController();

export const setInterviewRoutes = (app: Router) => {
  app.post('/interviews/start', interviewController.startInterview.bind(interviewController));
  app.post('/interviews/respond', interviewController.respondInterview.bind(interviewController));
};