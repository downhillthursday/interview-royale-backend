import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createBugReport, getBugReports } from '../controllers/bugReportController';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'bug-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export const setBugReportRoutes = (apiRouter: Router) => {
  router.post('/', upload.single('screenshot'), createBugReport);
  router.get('/', getBugReports);
  
  apiRouter.use('/bug-reports', router);
};
