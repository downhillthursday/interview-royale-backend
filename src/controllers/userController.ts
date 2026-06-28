import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { UserModel } from '../models/UserModel';
import {
  buildStoredResumeName,
  ensureResumeStorageDir,
  isPdfBuffer,
  RESUME_STORAGE_DIR,
  sanitizeFileName,
} from '../utils/resumeUpload';

const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const uploadsDir = path.join(__dirname, '../../uploads');

const buildResumeUrl = (userId: string) => `${getBaseUrl()}/api/resumes/${userId}/download`;

const emptyResume = () => ({
  status: 'none',
  originalName: '',
  storedName: '',
  fileName: '',
  storedFileName: '',
  url: '',
  mimeType: '',
  size: 0,
  uploadedAt: '',
  storagePath: '',
});

const deleteFileIfExists = async (filePath: string | undefined): Promise<void> => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      console.warn('Could not delete file:', filePath, err);
    }
  }
};

const isWithinResumeStorage = (filePath: string): boolean => {
  const resolvedStorageDir = path.resolve(RESUME_STORAGE_DIR) + path.sep;
  const resolvedFilePath = path.resolve(filePath);
  return resolvedFilePath.startsWith(resolvedStorageDir);
};

export class UserController {
  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      let user = await UserModel.findOne({ userId });
      if (!user) {
        user = new UserModel({ userId });
        await user.save();
      }

      const profile = user.toObject ? user.toObject() : { ...user };
      res.status(200).json({
        ...profile,
        skills: profile.primarySkills ?? [],
        tools: profile.technologies ?? [],
        profilePictureUrl: profile.photoURL ?? '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      const updates = { ...req.body };

      if (updates.skills && !updates.primarySkills) {
        updates.primarySkills = updates.skills;
      }
      if (updates.tools && !updates.technologies) {
        updates.technologies = updates.tools;
      }
      if (updates.profilePictureUrl && !updates.photoURL) {
        updates.photoURL = updates.profilePictureUrl;
      }

      let user = await UserModel.findOneAndUpdate({ userId }, updates, { new: true, upsert: true });
      const profile = user?.toObject ? user.toObject() : { ...user };
      res.status(200).json({
        ...profile,
        skills: profile.primarySkills ?? [],
        tools: profile.technologies ?? [],
        profilePictureUrl: profile.photoURL ?? '',
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const photoURL = `${getBaseUrl()}/uploads/${req.file.filename}`;
      const user = await UserModel.findOneAndUpdate({ userId }, { photoURL }, { new: true, upsert: true });
      res.status(200).json({ success: true, photoURL, profilePictureUrl: photoURL, user });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async uploadResume(req: Request, res: Response): Promise<void> {
    let newResumePath = '';
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      const routeUserId = req.params.userId;

      if (routeUserId !== userId) {
        res.status(403).json({ error: 'You can only upload a resume for your own profile' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No resume file uploaded' });
        return;
      }

      if (!req.file.buffer || req.file.buffer.length === 0 || req.file.size === 0) {
        res.status(400).json({ error: 'Resume file is empty' });
        return;
      }

      if (!isPdfBuffer(req.file.buffer)) {
        res.status(415).json({ error: 'Only valid PDF resumes are allowed' });
        return;
      }

      await ensureResumeStorageDir();

      const existingUser = await UserModel.findOne({ userId });
      const existingResumePath = existingUser?.resume?.storagePath;

      const storedName = buildStoredResumeName();
      newResumePath = path.join(RESUME_STORAGE_DIR, storedName);
      const originalName = sanitizeFileName(req.file.originalname || 'resume.pdf');

      await fs.writeFile(newResumePath, req.file.buffer);

      const resume = {
        status: 'uploaded',
        originalName,
        storedName,
        fileName: originalName,
        storedFileName: storedName,
        url: buildResumeUrl(userId),
        mimeType: 'application/pdf',
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
        storagePath: newResumePath,
      };

      const user = existingUser ?? new UserModel({ userId });
      user.resume = resume;
      await user.save();

      if (existingResumePath && existingResumePath !== newResumePath) {
        await deleteFileIfExists(existingResumePath);
      }

      const resumeURL = resume.url;
      res.status(200).json({ success: true, resumeURL, user });
    } catch (error) {
      await deleteFileIfExists(newResumePath);
      console.error('Error uploading resume:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async getResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      const routeUserId = req.params.userId;

      if (routeUserId !== userId) {
        res.status(403).json({ error: 'You can only access your own resume' });
        return;
      }

      const user = await UserModel.findOne({ userId });
      if (!user || !user.resume?.url) {
        res.status(404).json({ error: 'Resume not found' });
        return;
      }

      const resume = {
        ...emptyResume(),
        ...user.resume,
        url: user.resume.url || buildResumeUrl(userId),
      };

      res.status(200).json({ success: true, resume });
    } catch (error) {
      console.error('Error fetching resume:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async downloadResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      const resumeId = req.params.resumeId;

      if (resumeId !== userId) {
        res.status(403).json({ error: 'You can only download your own resume' });
        return;
      }

      const user = await UserModel.findOne({ userId });
      if (!user?.resume?.storagePath) {
        res.status(404).json({ error: 'Resume not found' });
        return;
      }

      const resumePath = user.resume.storagePath;
      if (!isWithinResumeStorage(resumePath)) {
        res.status(400).json({ error: 'Invalid resume storage path' });
        return;
      }

      await fs.access(resumePath);
      const stats = await fs.stat(resumePath);
      const downloadName = sanitizeFileName(user.resume.originalName || 'resume.pdf');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(stats.size));
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);

      const stream = createReadStream(resumePath);
      stream.on('error', (streamError) => {
        console.error('Error streaming resume:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream resume' });
          return;
        }
        res.destroy(streamError as Error);
      });

      stream.pipe(res);
    } catch (error) {
      console.error('Error downloading resume:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  public async deleteResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }
      const routeUserId = req.params.userId;

      if (routeUserId !== userId) {
        res.status(403).json({ error: 'You can only delete your own resume' });
        return;
      }

      const user = await UserModel.findOne({ userId });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.resume || !user.resume.url) {
        res.status(404).json({ error: 'No resume found for this user' });
        return;
      }

      const resumePath = user.resume.storagePath || null;

      user.resume = emptyResume();
      await user.save();

      if (resumePath) {
        await deleteFileIfExists(resumePath);
      }

      res.status(200).json({ success: true, message: 'Resume deleted', user });
    } catch (error) {
      console.error('Error deleting resume:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
