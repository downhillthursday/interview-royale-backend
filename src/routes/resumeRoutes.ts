import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateUser } from '../middleware/authenticate';

const router = Router();
const userController = new UserController();

router.get('/:resumeId/download', authenticateUser, userController.downloadResume.bind(userController));

export const setResumeRoutes = (apiRouter: Router) => {
  apiRouter.use('/resumes', router);
};