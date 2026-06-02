import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { setInterviewRoutes } from './routes/interviewRoutes';
import { setResultsRoutes } from './routes/resultsRoutes';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(json());

app.get('/', (_, res) => {
  res.send('Interview Royale Backend Running');
});

const apiRouter = express.Router();
setInterviewRoutes(apiRouter);
setResultsRoutes(apiRouter);

app.use('/api', apiRouter);
app.use(errorHandler);

export default app;