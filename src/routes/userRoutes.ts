import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { UserController } from '../controllers/userController';
import { authenticateUser } from '../middleware/authenticate';
import { resumeUpload, resumeUploadRateLimit } from '../utils/resumeUpload';

const router = Router();
const userController = new UserController();

const uploadsDirectory = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const photoUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile photos'));
    }
  },
});

router.get('/:userId', authenticateUser, userController.getProfile.bind(userController));
router.put('/:userId', authenticateUser, userController.updateProfile.bind(userController));
router.post('/:userId/photo', authenticateUser, photoUpload.single('photo'), userController.uploadPhoto.bind(userController));
router.post('/:userId/resume', authenticateUser, resumeUploadRateLimit, resumeUpload.single('resume'), userController.uploadResume.bind(userController));
router.put('/:userId/resume', authenticateUser, resumeUploadRateLimit, resumeUpload.single('resume'), userController.uploadResume.bind(userController));
router.get('/:userId/resume', authenticateUser, userController.getResume.bind(userController));
router.delete('/:userId/resume', authenticateUser, userController.deleteResume.bind(userController));

export default router;
