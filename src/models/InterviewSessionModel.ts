import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionAnswer {
  question: string;
  answer: string;
  feedback?: string;
  score?: number;
}

export interface IInterviewSession extends Document {
  sessionId: string;
  userId: string; // Can be temporary string if no auth, or user._id if auth exists
  role: string;
  difficulty: string;
  keyFocusArea: string;
  status: 'active' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  overallScore?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  questionsAnswers: IQuestionAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const questionAnswerSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  feedback: { type: String },
  score: { type: Number }
});

const interviewSessionSchema = new Schema<IInterviewSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true },
    difficulty: { type: String, required: true },
    keyFocusArea: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    overallScore: { type: Number },
    summary: { type: String },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    questionsAnswers: [questionAnswerSchema]
  },
  {
    timestamps: true
  }
);

export const InterviewSessionModel = mongoose.model<IInterviewSession>(
  'InterviewSession',
  interviewSessionSchema
);
