import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import path from 'path';
import { setInterviewRoutes } from './routes/interviewRoutes';
import { setResultsRoutes } from './routes/resultsRoutes';
import { setSessionRoutes } from './routes/sessionRoutes';
import { setBugReportRoutes } from './routes/bugReportRoutes';
import userRoutes from './routes/userRoutes';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_, res) => {
  res.send('Interview Royale Backend Running');
});

const apiRouter = express.Router();
setInterviewRoutes(apiRouter);
setResultsRoutes(apiRouter);
setSessionRoutes(apiRouter);
setBugReportRoutes(apiRouter);

app.use('/api', apiRouter);
app.use('/api/users', userRoutes);
app.use(errorHandler);

export default app;