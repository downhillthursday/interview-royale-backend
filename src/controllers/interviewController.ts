import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { InterviewSession, Message, sessions, sessionMessages } from '../models/interviewSession';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSystemPrompt = (role: string, keyFocusArea: string, difficulty: string) => {
    return `You are an expert technical interviewer for a ${role} position focusing on ${keyFocusArea}. The difficulty level is ${difficulty}. 
Ask clear, concise, and professional interview questions. 
Evaluate the candidate's answers and ask follow-up questions if necessary, or move on to the next topic. 
Only ask one question at a time. Do not provide the answer to your own questions. Keep your responses brief and conversational.`;
};

class InterviewController {
  public async startInterview(req: Request, res: Response): Promise<void> {
    const { role, keyFocusArea, difficulty } = req.body;
    
    // Validate request
    if (!role || !keyFocusArea) {
      res.status(400).json({ error: 'role and keyFocusArea are required' });
      return;
    }

    const interviewId = uuidv4();
    const sessionDifficulty = difficulty || 'Intermediate';
    
    const session: InterviewSession = {
      interviewId,
      currentQuestionNumber: 0,
      totalQuestions: 5, // A limit of 5 questions for the session
      role,
      keyFocusArea,
      difficulty: sessionDifficulty,
      status: 'active'
    };

    sessions[interviewId] = session;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: getSystemPrompt(role, keyFocusArea, sessionDifficulty) },
                { role: 'user', content: 'Hi, I am ready for the interview. Please ask the first question.' }
            ],
            model: 'openai/gpt-oss-120b',
        });

        const firstQuestion = chatCompletion.choices[0]?.message?.content || 'Could you please introduce yourself?';

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
    } catch (error) {
        console.error('Error starting interview:', error);
        res.status(500).json({ error: 'Failed to generate interview question' });
    }
  }

  public async respondInterview(req: Request, res: Response): Promise<void> {
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

    try {
        const history = sessionMessages[interviewId].map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: getSystemPrompt(session.role, session.keyFocusArea, session.difficulty) },
                { role: 'user', content: 'Hi, I am ready for the interview. Please ask the first question.' },
                ...history
            ],
            model: 'openai/gpt-oss-120b',
        });

        const nextQuestion = chatCompletion.choices[0]?.message?.content || 'Thank you. Let us move to the next question.';

        // Store the next question in history
        sessionMessages[interviewId].push({
          id: uuidv4(),
          role: 'assistant',
          content: nextQuestion
        });

        res.json({
          nextQuestion
        });
    } catch (error) {
        console.error('Error in respondInterview:', error);
        res.status(500).json({ error: 'Failed to generate next question' });
    }
  }
}

export default InterviewController;