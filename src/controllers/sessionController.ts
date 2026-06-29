import { Request, Response } from 'express';
import { InterviewSessionModel } from '../models/InterviewSessionModel';
import { UserModel } from '../models/UserModel';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import { normalizeInterviewConfig } from '../utils';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class SessionController {
  // Create a new interview session
  public async createSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }

      const config = normalizeInterviewConfig(req.body);
      const { interviewFocus, technology, role, keyFocusArea, difficulty } = config;

      if (!interviewFocus || !technology) {
        res.status(400).json({ error: 'interviewFocus and technology are required' });
        return;
      }

      const sessionId = uuidv4();

      const session = new InterviewSessionModel({
        sessionId,
        userId,
        role,
        keyFocusArea,
        interviewFocus,
        technology,
        difficulty: difficulty || 'Intermediate',
        status: 'active',
        questionsAnswers: []
      });

      await session.save();

      res.status(201).json({
        success: true,
        sessionId: session.sessionId,
        message: 'Interview session created'
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create interview session' });
    }
  }

  // Get a single session by ID
  public async getSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }

      const { id } = req.params;

      const session = await InterviewSessionModel.findOne({ sessionId: id });

      if (!session) {
        res.status(404).json({ error: 'Interview session not found' });
        return;
      }

      if (session.userId !== userId) {
        res.status(403).json({ error: 'You can only access your own interview sessions' });
        return;
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Error retrieving session:', error);
      res.status(500).json({ error: 'Failed to retrieve interview session' });
    }
  }

  // Get all sessions for a user
  public async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }

      const { userId: routeUserId } = req.params;

      if (routeUserId !== userId) {
        res.status(403).json({ error: 'You can only access your own interview history' });
        return;
      }

      const sessions = await InterviewSessionModel.find({ userId: routeUserId }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Error retrieving user sessions:', error);
      res.status(500).json({ error: 'Failed to retrieve interview history' });
    }
  }

  // Complete an interview session and generate feedback
  public async completeSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ error: 'Authorization required' });
        return;
      }

      const { id } = req.params;
      const { questionsAnswers } = req.body;

      const session = await InterviewSessionModel.findOne({ sessionId: id });

      if (!session) {
        res.status(404).json({ error: 'Interview session not found' });
        return;
      }

      if (session.userId !== userId) {
        res.status(403).json({ error: 'You can only complete your own interview sessions' });
        return;
      }

      if (session.status === 'completed') {
        res.status(400).json({ error: 'Interview already completed' });
        return;
      }

      // Update questions and answers if provided
      if (questionsAnswers && Array.isArray(questionsAnswers)) {
        session.questionsAnswers = questionsAnswers;
      }

      // Generate feedback using Groq
      const feedbackPrompt = this.buildFeedbackPrompt(
        session.interviewFocus || session.role || '',
        session.technology || session.keyFocusArea || '',
        session.difficulty,
        session.questionsAnswers
      );

      try {
        const feedbackCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: feedbackPrompt
            }
          ],
          model: 'openai/gpt-oss-120b'
        });

        const feedbackText = feedbackCompletion.choices[0]?.message?.content || '';
        const { score, scores, summary, strengths, weaknesses } = this.parseFeedback(feedbackText);

        session.overallScore = score;
        session.scores = scores || {
          technical: score / 10,
          communication: score / 10,
          problemSolving: score / 10,
          confidence: score / 10,
          systemDesign: score / 10
        };
        session.summary = summary;
        session.strengths = strengths;
        session.weaknesses = weaknesses;
      } catch (groqError) {
        console.error('Error generating feedback:', groqError);
        // Continue without AI feedback - use basic scoring
        const basicScore = this.calculateBasicScore(session.questionsAnswers);
        session.overallScore = basicScore;
        session.scores = {
          technical: basicScore / 10,
          communication: basicScore / 10,
          problemSolving: basicScore / 10,
          confidence: basicScore / 10,
          systemDesign: basicScore / 10
        };
        session.summary = `Interview completed with ${session.questionsAnswers.length} questions answered.`;
        session.strengths = ['Completed interview'];
        session.weaknesses = [];
      }

      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();

      // Update User Streak
      if (!session.userId.startsWith('guest-')) {
        try {
          const completedSessions = await InterviewSessionModel.find({ 
            userId: session.userId, 
            status: 'completed' 
          });
          
          if (completedSessions.length > 0) {
            const dates = completedSessions
              .filter((s: any) => s.createdAt)
              .map((s: any) => new Date(s.createdAt).toDateString());
            
            const uniqueDates = [...new Set(dates)]
              .map((d) => new Date(d))
              .sort((a, b) => b.getTime() - a.getTime());

            let currentStreak = 0;
            if (uniqueDates.length > 0) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);

              let expectedDate = today;

              if (uniqueDates[0].getTime() === today.getTime()) {
                currentStreak = 1;
                expectedDate = yesterday;
              } else if (uniqueDates[0].getTime() === yesterday.getTime()) {
                currentStreak = 1;
                expectedDate = new Date(yesterday);
                expectedDate.setDate(expectedDate.getDate() - 1);
              }

              if (currentStreak > 0) {
                for (let i = 1; i < uniqueDates.length; i++) {
                  if (uniqueDates[i].getTime() === expectedDate.getTime()) {
                    currentStreak++;
                    expectedDate.setDate(expectedDate.getDate() - 1);
                  } else {
                    break;
                  }
                }
              }
            }
            
            const user = await UserModel.findOne({ userId: session.userId });
            if (user) {
              user.currentStreak = currentStreak;
              if (currentStreak > user.longestStreak) {
                user.longestStreak = currentStreak;
              }
              user.totalInterviews = completedSessions.length;
              await user.save();
            }
          }
        } catch (streakError) {
          console.error('Error updating user streak:', streakError);
        }
      }

      res.json({
        success: true,
        message: 'Interview completed successfully',
        sessionId: session.sessionId,
        score: session.overallScore
      });
    } catch (error) {
      console.error('Error completing session:', error);
      res.status(500).json({ error: 'Failed to complete interview session' });
    }
  }

  // Helper: Build feedback prompt for Groq
  private buildFeedbackPrompt(
    interviewFocus: string,
    technology: string,
    difficulty: string,
    questionsAnswers: any[]
  ): string {
    const qa = questionsAnswers
      .map(
        (qa, idx) =>
          `Q${idx + 1}: ${qa.question}\nA${idx + 1}: ${qa.answer}`
      )
      .join('\n\n');

    return `You are an expert technical interviewer evaluating an interview transcript.

Interview Details:
- Interview Focus: ${interviewFocus}
- Technology: ${technology}
The selected interview focus and technology represent the candidate's chosen technical area. Generate feedback specifically for these topics.
- Difficulty Level: ${difficulty}

Interview Transcript:
${qa}

Please evaluate this interview and provide feedback in the following JSON format:
{
  "score": <number 0-100>,
  "scores": {
    "technical": <number 0-10>,
    "communication": <number 0-10>,
    "problemSolving": <number 0-10>,
    "confidence": <number 0-10>,
    "systemDesign": <number 0-10>
  },
  "summary": "<one paragraph summary>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...]
}

Provide ONLY the JSON response, no additional text.`;
  }

  // Helper: Parse feedback JSON from Groq response
  private parseFeedback(feedbackText: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing feedback JSON:', error);
    }

    // Fallback if parsing fails
    return {
      score: 75,
      scores: {
        technical: 7.5,
        communication: 7.5,
        problemSolving: 7.5,
        confidence: 7.5,
        systemDesign: 7.5
      },
      summary: feedbackText || 'Interview completed',
      strengths: ['Answered all questions'],
      weaknesses: []
    };
  }

  // Helper: Calculate basic score if AI feedback fails
  private calculateBasicScore(questionsAnswers: any[]): number {
    if (!questionsAnswers.length) return 0;

    let totalScore = 0;
    let count = 0;

    questionsAnswers.forEach((qa) => {
      // Rough heuristic: longer answers tend to be more thoughtful
      const answerLength = (qa.answer || '').split(' ').length;
      const score = Math.min(100, Math.max(40, (answerLength / 20) * 100));
      totalScore += score;
      count++;
    });

    return Math.round(totalScore / count);
  }
}

export default new SessionController();
