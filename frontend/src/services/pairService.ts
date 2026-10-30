import { api } from './api';
import type { DuplaDetalhada, PairFormationResult, HistoryFilters, ApiSuccessResponse, ApiMessageResponse } from '../types';

export const pairService = {
  // Generate automatic pairs for an event (preview mode by default to allow review before saving)
  async generatePairs(eventId: number, preview = true): Promise<PairFormationResult> {
    const url = preview ? `/pairs/event/${eventId}/generate?preview=true` : `/pairs/event/${eventId}/generate`;
    const response = await api.post<ApiSuccessResponse<PairFormationResult>>(url);
    return response.data.data;
  },

  // Save pairs for an event
  async savePairs(eventId: number, duplas: { cd_cadeirante: number; cd_condutor: number }[]): Promise<DuplaDetalhada[]> {
    const response = await api.post<ApiSuccessResponse<DuplaDetalhada[]>>(`/pairs/event/${eventId}/save`, {
      pairs: duplas,
      duplas,
    });
    return response.data.data;
  },

  // Delete a specific pair
  async deletePair(pairId: number): Promise<void> {
    await api.delete<ApiMessageResponse>(`/pairs/${pairId}`);
  },

  // Create a single pair for an event
  async createPair(eventId: number, cd_cadeirante: number, cd_condutor: number): Promise<DuplaDetalhada> {
    const response = await api.post<ApiSuccessResponse<DuplaDetalhada>>(`/pairs/event/${eventId}`, {
      wheelchairUserId: cd_cadeirante,
      runnerId: cd_condutor,
      cd_cadeirante,
      cd_condutor,
    });
    return response.data.data;
  },

  // List pairs formed for a specific event
  async listByEvent(eventId: number): Promise<DuplaDetalhada[]> {
    const response = await api.get<ApiSuccessResponse<DuplaDetalhada[] | { evento?: unknown; duplas?: DuplaDetalhada[] }>>(`/pairs/event/${eventId}`);
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && Array.isArray((data as any).duplas)) {
      return (data as any).duplas;
    }
    return [];
  },

  // Manually edit a pair in database
  async editPair(pairId: number, cd_cadeirante: number, cd_condutor: number): Promise<DuplaDetalhada> {
    const response = await api.put<ApiSuccessResponse<DuplaDetalhada>>(`/pairs/${pairId}`, {
      wheelchairUserId: cd_cadeirante,
      runnerId: cd_condutor,
      cd_cadeirante,
      cd_condutor,
    });
    return response.data.data;
  },

  // Clear pairs of an event
  async clearPairs(eventId: number): Promise<void> {
    await api.delete<ApiMessageResponse>(`/pairs/event/${eventId}`);
  },

  // Retrieve pair history with filters
  async getHistory(filters?: HistoryFilters): Promise<DuplaDetalhada[]> {
    const params: Record<string, string | number> = {};
    if (filters?.cd_evento) params.cd_evento = filters.cd_evento;
    if (filters?.data_inicio) params.data_inicio = filters.data_inicio;
    if (filters?.data_fim) params.data_fim = filters.data_fim;
    if (filters?.search) params.search = filters.search;

    const response = await api.get<ApiSuccessResponse<DuplaDetalhada[]>>('/pairs/history', { params });
    return response.data.data;
  },
};
