import mongoose, { Schema, Document } from 'mongoose';

export interface IBugReport extends Document {
  title: string;
  category: string;
  severity: string;
  description: string;
  stepsToReproduce?: string;
  screenshotUrl?: string;
  metadata: {
    browser: string;
    userAgent: string;
    currentUrl: string;
    screenResolution: string;
    timestamp: Date;
    userId?: string;
    interviewSessionId?: string;
  };
  status: string;
  createdAt: Date;
}

const BugReportSchema: Schema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, required: true },
  description: { type: String, required: true },
  stepsToReproduce: { type: String },
  screenshotUrl: { type: String },
  metadata: {
    browser: { type: String, required: true },
    userAgent: { type: String, required: true },
    currentUrl: { type: String, required: true },
    screenResolution: { type: String, required: true },
    timestamp: { type: Date, required: true },
    userId: { type: String },
    interviewSessionId: { type: String },
  },
  status: { type: String, default: 'Open' },
  createdAt: { type: Date, default: Date.now },
});

export const BugReportModel = mongoose.model<IBugReport>('BugReport', BugReportSchema);
