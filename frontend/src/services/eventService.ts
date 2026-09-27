import { api } from './api';
import type { Evento, ApiSuccessResponse, ApiMessageResponse } from '../types';

export interface EventFormData {
  nm_evento: string;
  dt_evento: string;
}

export const eventService = {
  async getEvents(): Promise<Evento[]> {
    const response = await api.get<ApiSuccessResponse<Evento[]>>('/eventos');
    return response.data.data;
  },

  async getEventById(id: number): Promise<Evento> {
    const response = await api.get<ApiSuccessResponse<Evento>>(`/eventos/${id}`);
    return response.data.data;
  },

  async createEvent(data: EventFormData): Promise<Evento> {
    const response = await api.post<ApiSuccessResponse<Evento>>('/eventos', data);
    return response.data.data;
  },

  async updateEvent(id: number, data: EventFormData): Promise<Evento> {
    const response = await api.put<ApiSuccessResponse<Evento>>(`/eventos/${id}`, data);
    return response.data.data;
  },

  async deleteEvent(id: number): Promise<void> {
    await api.delete<ApiMessageResponse>(`/eventos/${id}`);
  },
};
