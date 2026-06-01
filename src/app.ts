import express from 'express';
import { json } from 'body-parser';
import { setInterviewRoutes } from './routes/interviewRoutes';
import { setResultsRoutes } from './routes/resultsRoutes';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(json());

setInterviewRoutes(app);
setResultsRoutes(app);

app.use(errorHandler);

export default app;