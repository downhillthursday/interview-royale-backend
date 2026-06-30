import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { InterviewSessionModel, IMessage } from '../models/InterviewSessionModel';
import Groq from 'groq-sdk';
import { normalizeInterviewConfig } from '../utils';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSystemPrompt = (interviewFocus: string, technology: string, difficulty: string) => {
  const focus = interviewFocus || 'the selected technical area';
  const stack = technology || 'the selected technologies';

  return `You are an expert technical interviewer for the selected interview focus: ${focus}. The selected technology stack is: ${stack}. The selected interview focus and technology represent the candidate's chosen technical area. Generate interview questions specifically around these topics. The difficulty level is ${difficulty}.
   If the difficulty is set to easy or junior, make the interview more conceptual and easy. 
Ask clear, concise, and professional interview questions. 
Evaluate the candidate's answers and ask follow-up questions if necessary, or move on to the next topic. 
Only ask one question at a time. Do not provide the answer to your own questions. Keep your responses brief and conversational.`;
};

class InterviewController {
  public async startInterview(req: Request, res: Response): Promise<void> {
    const config = normalizeInterviewConfig(req.body);
    const { interviewFocus, technology, role, keyFocusArea, difficulty, userId } = config;

    if (!interviewFocus || !technology) {
      res.status(400).json({ error: 'interviewFocus and technology are required' });
      return;
    }

    const interviewId = uuidv4();
    const sessionDifficulty = difficulty || 'Intermediate';
    const sessionUserId = userId || `guest-${uuidv4()}`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: getSystemPrompt(interviewFocus, technology, sessionDifficulty) },
          { role: 'user', content: 'Hi, I am ready for the interview. Please ask the first question.' }
        ],
        model: 'openai/gpt-oss-120b',
      });

      const firstQuestion = chatCompletion.choices[0]?.message?.content || 'Could you please introduce yourself?';

      // Create MongoDB session record
      const dbSession = new InterviewSessionModel({
        sessionId: interviewId,
        userId: sessionUserId,
        role,
        keyFocusArea,
        interviewFocus,
        technology,
        difficulty: sessionDifficulty,
        status: 'active',
        currentQuestionNumber: 0,
        totalQuestions: 5,
        questionsAnswers: [],
        messages: [
          {
            id: uuidv4(),
            role: 'assistant',
            content: firstQuestion
          }
        ]
      });

      await dbSession.save();

      res.json({
        interviewId,
        sessionId: interviewId,
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

    try {
      const session = await InterviewSessionModel.findOne({ sessionId: interviewId });
      if (!session) {
        res.status(404).json({ error: 'Interview session not found' });
        return;
      }

      if (session.status === 'completed') {
        res.status(400).json({ error: 'Interview already completed' });
        return;
      }

      // Save answer
      session.messages.push({
        id: uuidv4(),
        role: 'user',
        content: answer
      });

      session.currentQuestionNumber += 1;

      // Check if interview should end
      if (session.currentQuestionNumber >= session.totalQuestions) {
        session.status = 'completed';

        session.questionsAnswers = this.extractQuestionsAnswers(session.messages);

        await session.save();

        res.json({
          status: 'completed',
          sessionId: interviewId
        });
        return;
      }

      const history = session.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: getSystemPrompt(session.interviewFocus || session.role || '', session.technology || session.keyFocusArea || '', session.difficulty) },
          { role: 'user', content: 'Hi, I am ready for the interview. Please ask the first question.' },
          ...history
        ],
        model: 'openai/gpt-oss-120b',
      });

      const nextQuestion = chatCompletion.choices[0]?.message?.content || 'Thank you. Let us move to the next question.';

      // Store the next question in history
      session.messages.push({
        id: uuidv4(),
        role: 'assistant',
        content: nextQuestion
      });

      await session.save();

      res.json({
        nextQuestion,
        sessionId: interviewId
      });
    } catch (error) {
      console.error('Error in respondInterview:', error);
      res.status(500).json({ error: 'Failed to generate next question or save progress' });
    }
  }

  // Helper: Extract questions and answers from message history
  private extractQuestionsAnswers(messages: IMessage[]): any[] {
    const questionsAnswers = [];

    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'assistant') {
        // This is a question
        const question = messages[i].content;

        // Find the corresponding answer (next user message)
        let answer = '';
        if (i + 1 < messages.length && messages[i + 1].role === 'user') {
          answer = messages[i + 1].content;
        }

        if (question && answer) {
          questionsAnswers.push({
            question,
            answer,
            feedback: '',
            score: 0
          });
        }
      }
    }

    return questionsAnswers;
  }
}

export default InterviewController;