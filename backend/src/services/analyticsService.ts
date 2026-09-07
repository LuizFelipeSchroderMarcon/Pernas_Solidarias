import { AnalyticsRepository } from '../repositories/analyticsRepository';
import { AnalyticsRankingsResponse } from '../models/types';

export class AnalyticsService {
  private analyticsRepository: AnalyticsRepository;

  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
  }

  async getRankings(limit = 5): Promise<AnalyticsRankingsResponse> {
    const [topRunners, topWheelchairUsers, topEvents] = await Promise.all([
      this.analyticsRepository.getTopRunners(limit),
      this.analyticsRepository.getTopWheelchairUsers(limit),
      this.analyticsRepository.getTopEvents(limit),
    ]);

    return {
      top_runners: topRunners,
      top_wheelchair_users: topWheelchairUsers,
      top_events: topEvents,
    };
  }
}
