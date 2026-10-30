import { api } from './api';
import type { DuplaDetalhada, PairFormationResult, HistoryFilters, ApiSuccessResponse, ApiMessageResponse } from '../types';

export const pairService = {
  // Generate automatic pairs for an event (preview mode by default to allow review before saving)
  async generatePairs(eventId: number, preview = true): Promise<PairFormationResult> {
    const url = preview ? `/duplas/evento/${eventId}/gerar?preview=true` : `/duplas/evento/${eventId}/gerar`;
    const response = await api.post<ApiSuccessResponse<PairFormationResult>>(url);
    return response.data.data;
  },

  // Save pairs for an event
  async savePairs(eventId: number, duplas: { cd_cadeirante: number; cd_condutor: number }[]): Promise<DuplaDetalhada[]> {
    const response = await api.post<ApiSuccessResponse<DuplaDetalhada[]>>(`/duplas/evento/${eventId}/salvar`, {
      duplas,
    });
    return response.data.data;
  },

  // Delete a specific pair
  async deletePair(pairId: number): Promise<void> {
    await api.delete<ApiMessageResponse>(`/duplas/${pairId}`);
  },

  // Create a single pair for an event
  async createPair(eventId: number, cd_cadeirante: number, cd_condutor: number): Promise<DuplaDetalhada> {
    const response = await api.post<ApiSuccessResponse<DuplaDetalhada>>(`/duplas/evento/${eventId}`, {
      cd_cadeirante,
      cd_condutor,
    });
    return response.data.data;
  },

  // List pairs formed for a specific event
  async listByEvent(eventId: number): Promise<DuplaDetalhada[]> {
    const response = await api.get<any>(`/duplas/evento/${eventId}`);
    const data = response.data?.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.duplas)) {
      return data.duplas;
    }
    return [];
  },

  // Manually edit a pair in database
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

  // Retrieve pair history with filters
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
