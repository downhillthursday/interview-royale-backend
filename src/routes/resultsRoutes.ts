import { Router } from 'express';
import ResultsController from '../controllers/resultsController';

const router = Router();
const resultsController = new ResultsController();

export const setResultsRoutes = (app: Router) => {
  app.get('/results', resultsController.getResults.bind(resultsController));
  app.post('/results', resultsController.submitResults.bind(resultsController));
};