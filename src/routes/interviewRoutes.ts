import { Router } from 'express';
import InterviewController from '../controllers/interviewController';

const router = Router();
const interviewController = new InterviewController();

export const setInterviewRoutes = (app: Router) => {
  app.get('/interview', interviewController.getInterview.bind(interviewController));
  app.post('/interview', interviewController.createInterview.bind(interviewController));
};