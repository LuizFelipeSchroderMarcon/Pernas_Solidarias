import { api } from './api';
import type { DuplaDetalhada, PairFormationResult, HistoryFilters, ApiSuccessResponse, ApiMessageResponse } from '../types';

export const pairService = {
  // Generate automatic pairs for an event (RF03, RF04)
  async generatePairs(eventId: number): Promise<PairFormationResult> {
    const response = await api.post<ApiSuccessResponse<PairFormationResult>>(`/duplas/evento/${eventId}/gerar`);
    return response.data.data;
  },

  // List pairs formed for a specific event (RF06)
  async listByEvent(eventId: number): Promise<DuplaDetalhada[]> {
    const response = await api.get<ApiSuccessResponse<DuplaDetalhada[]>>(`/duplas/evento/${eventId}`);
    return response.data.data;
  },

  // Manually edit a pair (RF05, RN01, RN02, RN08)
  async editPair(pairId: number, cd_cadeirante: number, cd_condutor: number): Promise<DuplaDetalhada> {
    const response = await api.put<ApiSuccessResponse<DuplaDetalhada>>(`/duplas/${pairId}`, {
      cd_cadeirante,
      cd_condutor,
    });
    return response.data.data;
  },

  // Clear pairs of an event
  async clearPairs(eventId: number): Promise<void> {
    await api.delete<ApiMessageResponse>(`/duplas/evento/${eventId}`);
  },

  // Retrieve pair history with filters (RF06, RF09)
  async getHistory(filters?: HistoryFilters): Promise<DuplaDetalhada[]> {
    const params: Record<string, string | number> = {};
    if (filters?.cd_evento) params.cd_evento = filters.cd_evento;
    if (filters?.data_inicio) params.data_inicio = filters.data_inicio;
    if (filters?.data_fim) params.data_fim = filters.data_fim;
    if (filters?.search) params.search = filters.search;

    const response = await api.get<ApiSuccessResponse<DuplaDetalhada[]>>('/duplas/historico', { params });
    return response.data.data;
  },
};
