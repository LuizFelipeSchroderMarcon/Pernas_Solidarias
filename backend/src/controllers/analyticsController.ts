import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getRankings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const limit = Number.isNaN(parsedLimit) || parsedLimit < 1 ? 5 : Math.min(parsedLimit, 100);
      const data = await analyticsService.getRankings(limit);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }
}
