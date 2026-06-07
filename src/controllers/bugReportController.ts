import { Request, Response } from 'express';
import { BugReportModel } from '../models/BugReportModel';

export const createBugReport = async (req: Request, res: Response) => {
  try {
    const reportData = req.body;
    let metadata = reportData.metadata;

    // Handle multipart/form-data where metadata might be a JSON string
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.warn('Could not parse metadata as JSON:', e);
      }
    }

    const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    
    const newReport = new BugReportModel({
      ...reportData,
      metadata: metadata || {},
      screenshotUrl,
      status: 'Open',
    });
    
    await newReport.save();
    
    res.status(201).json({ message: 'Bug report created successfully', report: newReport });
  } catch (error) {
    console.error('Error creating bug report:', error);
    res.status(500).json({ error: 'Failed to create bug report' });
  }
};

export const getBugReports = async (req: Request, res: Response) => {
  try {
    const reports = await BugReportModel.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
};
