import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { InterviewSession, Message, sessions, sessionMessages } from '../models/interviewSession';

const questions: Record<string, Record<string, string[]>> = {
  "Frontend Developer": {
    "React": [
      "Tell me about yourself.",
      "Describe a React project you built.",
      "Explain React hooks.",
      "How does state management work?",
      "Any questions for me?"
    ]
  },
  "Backend Developer": {
    "Node.js": [
      "Tell me about yourself.",
      "Explain the event loop.",
      "What is middleware?",
      "How would you design an API?",
      "Any questions for me?"
    ]
  }
};

class InterviewController {
  public startInterview(req: Request, res: Response): void {
    const { role, keyFocusArea, difficulty } = req.body;
    
    // Validate request
    if (!role || !keyFocusArea) {
      res.status(400).json({ error: 'role and keyFocusArea are required' });
      return;
    }

    const availableQuestions = questions[role]?.[keyFocusArea];
    if (!availableQuestions) {
      res.status(400).json({ error: 'No questions available for this role and focus area combination.' });
      return;
    }

    const interviewId = uuidv4();
    const firstQuestion = availableQuestions[0];
    
    const session: InterviewSession = {
      interviewId,
      currentQuestionNumber: 0,
      totalQuestions: availableQuestions.length,
      role,
      keyFocusArea,
      difficulty: difficulty || 'Intermediate',
      status: 'active'
    };

    sessions[interviewId] = session;
    
    // Store the first message
    sessionMessages[interviewId] = [
      {
        id: uuidv4(),
        role: 'assistant',
        content: firstQuestion
      }
    ];

    res.json({
      interviewId,
      firstQuestion
    });
  }

  public respondInterview(req: Request, res: Response): void {
    const { interviewId, answer } = req.body;

    if (!interviewId || !answer) {
      res.status(400).json({ error: 'interviewId and answer are required' });
      return;
    }

    const session = sessions[interviewId];
    if (!session) {
      res.status(404).json({ error: 'Interview session not found' });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({ error: 'Interview already completed' });
      return;
    }

    // Save answer
    sessionMessages[interviewId].push({
      id: uuidv4(),
      role: 'user',
      content: answer
    });

    session.currentQuestionNumber += 1;
    
    // Check if interview should end
    if (session.currentQuestionNumber >= session.totalQuestions) {
      session.status = 'completed';
      res.json({
        status: 'completed'
      });
      return;
    }

    // Generate next question
    const availableQuestions = questions[session.role]?.[session.keyFocusArea];
    const nextQuestion = availableQuestions[session.currentQuestionNumber];

    // Store the next question in history
    sessionMessages[interviewId].push({
      id: uuidv4(),
      role: 'assistant',
      content: nextQuestion
    });

    res.json({
      nextQuestion
    });
  }
}

export default InterviewController;