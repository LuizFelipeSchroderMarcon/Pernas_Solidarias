import { api } from './api';
import type { Cadeirante, Condutor, ApiSuccessResponse, ApiMessageResponse } from '../types';

export interface CadeiranteFormData {
  nm_cadeirante: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  data_nascimento?: string;
  sexo?: string;
  possui_cadeira_propria: boolean;
  ativo?: boolean;
}

export interface CondutorFormData {
  nm_condutor: string;
  cpf: string;
  telefone: string;
  tam_camisa: string;
  data_nascimento?: string;
  sexo?: string;
  ativo?: boolean;
}

export const participantService = {
  // --- Cadeirantes ---
  async getCadeirantes(): Promise<Cadeirante[]> {
    const response = await api.get<ApiSuccessResponse<Cadeirante[]>>('/cadeirantes');
    return response.data.data;
  },

  async getCadeiranteById(id: number): Promise<Cadeirante> {
    const response = await api.get<ApiSuccessResponse<Cadeirante>>(`/cadeirantes/${id}`);
    return response.data.data;
  },

  async createCadeirante(data: CadeiranteFormData): Promise<Cadeirante> {
    const response = await api.post<ApiSuccessResponse<Cadeirante>>('/cadeirantes', data);
    return response.data.data;
  },

  async updateCadeirante(id: number, data: CadeiranteFormData): Promise<Cadeirante> {
    const response = await api.put<ApiSuccessResponse<Cadeirante>>(`/cadeirantes/${id}`, data);
    return response.data.data;
  },

  async toggleCadeiranteStatus(id: number): Promise<Cadeirante> {
    const response = await api.patch<ApiSuccessResponse<Cadeirante>>(`/cadeirantes/${id}/toggle-status`);
    return response.data.data;
  },

  async deleteCadeirante(id: number): Promise<void> {
    await api.delete<ApiMessageResponse>(`/cadeirantes/${id}`);
  },

  // --- Condutores ---
  async getCondutores(): Promise<Condutor[]> {
    const response = await api.get<ApiSuccessResponse<Condutor[]>>('/condutores');
    return response.data.data;
  },

  async getCondutorById(id: number): Promise<Condutor> {
    const response = await api.get<ApiSuccessResponse<Condutor>>(`/condutores/${id}`);
    return response.data.data;
  },

  async createCondutor(data: CondutorFormData): Promise<Condutor> {
    const response = await api.post<ApiSuccessResponse<Condutor>>('/condutores', data);
    return response.data.data;
  },

  async updateCondutor(id: number, data: CondutorFormData): Promise<Condutor> {
    const response = await api.put<ApiSuccessResponse<Condutor>>(`/condutores/${id}`, data);
    return response.data.data;
  },

  async toggleCondutorStatus(id: number): Promise<Condutor> {
    const response = await api.patch<ApiSuccessResponse<Condutor>>(`/condutores/${id}/toggle-status`);
    return response.data.data;
  },

  async deleteCondutor(id: number): Promise<void> {
    await api.delete<ApiMessageResponse>(`/condutores/${id}`);
  },
};
