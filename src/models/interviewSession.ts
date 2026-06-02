export interface InterviewSession {
  interviewId: string;
  currentQuestionNumber: number;
  totalQuestions: number;

  role: string;
  keyFocusArea: string;
  difficulty: string;

  status: 'active' | 'completed';
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

// In-memory store for Phase 5
export const sessions: Record<string, InterviewSession> = {};
export const sessionMessages: Record<string, Message[]> = {};
