export interface Interview {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: number; // in minutes
}

export interface Result {
  id: string;
  interviewId: string;
  score: number;
  feedback: string;
  submittedAt: Date;
}