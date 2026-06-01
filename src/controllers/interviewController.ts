import { Request, Response } from 'express';

class InterviewController {
  public getInterview(req: Request, res: Response): void {
    // Logic to retrieve an interview
    res.send('Interview details');
  }

  public createInterview(req: Request, res: Response): void {
    // Logic to create a new interview
    res.send('Interview created');
  }
}

export default InterviewController;