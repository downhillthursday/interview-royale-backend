import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import { setInterviewRoutes } from './routes/interviewRoutes';
import { setResultsRoutes } from './routes/resultsRoutes';
import { setSessionRoutes } from './routes/sessionRoutes';
import { setBugReportRoutes } from './routes/bugReportRoutes';
import { setResumeRoutes } from './routes/resumeRoutes';
import { setHealthRoutes } from './routes/healthRoutes';
import userRoutes from './routes/userRoutes';
import errorHandler from './middleware/errorHandler';

const app = express();
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(','));
}

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
app.use(json({ limit: '1mb' }));

app.get('/', (_, res) => {
  res.send('Interview Royale Backend Running');
});

const apiRouter = express.Router();
setHealthRoutes(apiRouter);
setInterviewRoutes(apiRouter);
setResultsRoutes(apiRouter);
setSessionRoutes(apiRouter);
setBugReportRoutes(apiRouter);
setResumeRoutes(apiRouter);

app.use('/api', apiRouter);
app.use('/api/users', userRoutes);
app.use(errorHandler);

export default app;