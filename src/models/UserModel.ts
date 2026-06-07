import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  displayName: string;
  targetRole: string;
  university: string;
  bio: string;
  location: string;
  joinDate: string;
  photoURL: string;
  resume: {
    status: string;
    fileName: string;
    uploadedAt: string;
  };
  socialLinks: {
    github: string;
    linkedin: string;
    portfolio: string;
  };
  primarySkills: string[];
  technologies: string[];
  areasOfInterest: string[];
  currentStreak: number;
  longestStreak: number;
  totalInterviews: number;
  achievements: any[];
  isPublic: boolean;
  shareableUrl: string;
  interviewPreferences: {
    domains: string[];
    difficulty: string;
    aiBehavior: string;
  };
}

const userSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: '' },
    targetRole: { type: String, default: '' },
    university: { type: String, default: '' },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    joinDate: { type: String, default: '' },
    photoURL: { type: String, default: '' },
    resume: {
      status: { type: String, default: 'none' },
      fileName: { type: String, default: '' },
      uploadedAt: { type: String, default: '' },
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    primarySkills: [{ type: String }],
    technologies: [{ type: String }],
    areasOfInterest: [{ type: String }],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalInterviews: { type: Number, default: 0 },
    achievements: [{ type: Schema.Types.Mixed }],
    isPublic: { type: Boolean, default: false },
    shareableUrl: { type: String, default: '' },
    interviewPreferences: {
      domains: [{ type: String }],
      difficulty: { type: String, default: 'Medium' },
      aiBehavior: { type: String, default: 'Neutral' },
    }
  },
  {
    timestamps: true
  }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
