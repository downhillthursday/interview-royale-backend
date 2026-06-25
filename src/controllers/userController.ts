import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { UserModel } from '../models/UserModel';

const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const uploadsDir = path.join(__dirname, '../../uploads');

export class UserController {
  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.uid;
      let user = await UserModel.findOne({ userId });
      if (!user) {
        user = new UserModel({ userId });
        await user.save();
      }

      const profile = user.toObject ? user.toObject() : { ...user };
      res.status(200).json({
        ...profile,
        skills: profile.primarySkills ?? profile.skills ?? [],
        tools: profile.technologies ?? profile.tools ?? [],
        profilePictureUrl: profile.photoURL ?? profile.profilePictureUrl ?? '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.uid;
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
        skills: profile.primarySkills ?? profile.skills ?? [],
        tools: profile.technologies ?? profile.tools ?? [],
        profilePictureUrl: profile.photoURL ?? profile.profilePictureUrl ?? '',
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.uid;
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
    try {
      const userId = (req as any).user.uid;
      if (!req.file) {
        res.status(400).json({ error: 'No resume file uploaded' });
        return;
      }

      const existingUser = await UserModel.findOne({ userId });
      if (existingUser && existingUser.resume?.storedFileName) {
        const existingResumePath = path.join(uploadsDir, existingUser.resume.storedFileName);
        try {
          await fs.unlink(existingResumePath);
        } catch (err) {
          console.warn('Could not delete old resume file:', existingResumePath, err);
        }
      }

      const resumeURL = `${getBaseUrl()}/uploads/${req.file.filename}`;
      const resume = {
        status: 'uploaded',
        fileName: req.file.originalname,
        storedFileName: req.file.filename,
        url: resumeURL,
        uploadedAt: new Date().toISOString(),
      };

      const user = await UserModel.findOneAndUpdate({ userId }, { resume }, { new: true, upsert: true });
      res.status(200).json({ success: true, resumeURL, user });
    } catch (error) {
      console.error('Error uploading resume:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async getResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.uid;
      const user = await UserModel.findOne({ userId });
      if (!user || !user.resume?.url) {
        res.status(404).json({ error: 'Resume not found' });
        return;
      }
      res.status(200).json({ success: true, resume: user.resume });
    } catch (error) {
      console.error('Error fetching resume:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async deleteResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.uid;
      const user = await UserModel.findOne({ userId });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!user.resume || !user.resume.url) {
        res.status(404).json({ error: 'No resume found for this user' });
        return;
      }

      const resumePath = user.resume.storedFileName ? path.join(uploadsDir, user.resume.storedFileName) : null;
      if (resumePath) {
        try {
          await fs.unlink(resumePath);
        } catch (err) {
          console.warn('Could not delete resume file:', resumePath, err);
        }
      }

      user.resume = {
        status: 'none',
        fileName: '',
        storedFileName: '',
        url: '',
        uploadedAt: '',
      };
      await user.save();

      res.status(200).json({ success: true, message: 'Resume deleted', user });
    } catch (error) {
      console.error('Error deleting resume:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
