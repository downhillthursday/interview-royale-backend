import { Router } from 'express';
import resultsController from '../controllers/resultsController';

export const setResultsRoutes = (app: Router) => {
  app.get('/results', resultsController.getResults.bind(resultsController));
  app.post('/results', resultsController.submitResults.bind(resultsController));
};