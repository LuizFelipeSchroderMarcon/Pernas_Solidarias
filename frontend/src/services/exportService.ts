import { api } from './api';
import { downloadBlob } from '../utils/formatters';
import type { HistoryFilters } from '../types';

export const exportService = {
  /**
   * Downloads pairs of an event in Excel (.xlsx) or CSV (.csv) format, with or without CPF.
   */
  async exportEventReport(eventId: number, includeCpf: boolean, format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
    const response = await api.get(`/exportar/evento/${eventId}`, {
      params: {
        comCpf: includeCpf,
        formato: format,
      },
      responseType: 'blob',
    });

    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const filename = `duplas_evento_${eventId}_${includeCpf ? 'com_cpf' : 'sem_cpf'}.${extension}`;
    downloadBlob(response.data, filename);
  },

  /**
   * Downloads consolidated pair history in Excel (.xlsx) or CSV (.csv) format (RF10).
   */
  async exportHistoryReport(
    includeCpf: boolean,
    format: 'xlsx' | 'csv' = 'xlsx',
    filters?: HistoryFilters
  ): Promise<void> {
    const response = await api.get('/exportar/historico', {
      params: {
        comCpf: includeCpf,
        formato: format,
        ...filters,
      },
      responseType: 'blob',
    });

    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const filename = `historico_duplas_${includeCpf ? 'com_cpf' : 'sem_cpf'}.${extension}`;
    downloadBlob(response.data, filename);
  },
};
