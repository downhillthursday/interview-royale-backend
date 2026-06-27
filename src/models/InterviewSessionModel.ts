import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionAnswer {
  question: string;
  answer: string;
  feedback?: string;
  score?: number;
}

export interface IMessage {
  id?: string;
  role: 'assistant' | 'user';
  content: string;
}

export interface IInterviewSession extends Document {
  sessionId: string;
  userId: string; // Can be temporary string if no auth, or user._id if auth exists
  role: string;
  difficulty: string;
  keyFocusArea: string;
  interviewFocus: string;
  technology: string;
  status: 'active' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  overallScore?: number;
  scores?: {
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    systemDesign: number;
  };
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  questionsAnswers: IQuestionAnswer[];
  messages: IMessage[];
  currentQuestionNumber: number;
  totalQuestions: number;
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
    role: { type: String, default: '' },
    difficulty: { type: String, required: true },
    keyFocusArea: { type: String, default: '' },
    interviewFocus: { type: String, default: '' },
    technology: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    overallScore: { type: Number },
    scores: {
      technical: { type: Number },
      communication: { type: Number },
      problemSolving: { type: Number },
      confidence: { type: Number },
      systemDesign: { type: Number }
    },
    summary: { type: String },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    questionsAnswers: [questionAnswerSchema],
    messages: [{
      id: { type: String },
      role: { type: String, enum: ['assistant', 'user'], required: true },
      content: { type: String, required: true }
    }],
    currentQuestionNumber: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 5 }
  },
  {
    timestamps: true
  }
);

export const InterviewSessionModel = mongoose.model<IInterviewSession>(
  'InterviewSession',
  interviewSessionSchema
);
