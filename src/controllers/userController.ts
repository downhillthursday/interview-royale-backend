import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';

export class UserController {
  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      let user = await UserModel.findOne({ userId });
      if (!user) {
        user = new UserModel({ userId });
        await user.save();
      }
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updates = req.body;
      let user = await UserModel.findOneAndUpdate({ userId }, updates, { new: true, upsert: true });
      res.status(200).json(user);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const photoURL = `http://localhost:5000/uploads/${req.file.filename}`;
      let user = await UserModel.findOneAndUpdate({ userId }, { photoURL }, { new: true, upsert: true });
      res.status(200).json({ photoURL });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public async uploadResume(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const resume = {
        status: 'uploaded',
        fileName: req.file.originalname,
        uploadedAt: new Date().toLocaleDateString(),
      };
      let user = await UserModel.findOneAndUpdate({ userId }, { resume }, { new: true, upsert: true });
      res.status(200).json({ resume });
    } catch (error) {
      console.error('Error uploading resume:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
