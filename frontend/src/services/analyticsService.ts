import { api } from './api';
import type { AnalyticsRankings, ApiSuccessResponse } from '../types';

export const analyticsService = {
  async getRankings(limit = 5): Promise<AnalyticsRankings> {
    const response = await api.get<ApiSuccessResponse<AnalyticsRankings>>('/analytics/rankings', {
      params: { limit },
    });
    return response.data.data;
  },
};
