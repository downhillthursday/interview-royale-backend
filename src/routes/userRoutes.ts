import { Router } from 'express';
import multer from 'multer';
import { UserController } from '../controllers/userController';
import path from 'path';

const router = Router();
const userController = new UserController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.get('/:userId', userController.getProfile.bind(userController));
router.put('/:userId', userController.updateProfile.bind(userController));
router.post('/:userId/photo', upload.single('photo'), userController.uploadPhoto.bind(userController));
router.post('/:userId/resume', upload.single('resume'), userController.uploadResume.bind(userController));

export default router;
