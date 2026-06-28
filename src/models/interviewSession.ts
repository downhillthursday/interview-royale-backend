export interface InterviewSession {
  interviewId: string;
  currentQuestionNumber: number;
  totalQuestions: number;

  role: string;
  keyFocusArea: string;
  interviewFocus: string;
  technology: string;
  difficulty: string;

  status: 'active' | 'completed';
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

