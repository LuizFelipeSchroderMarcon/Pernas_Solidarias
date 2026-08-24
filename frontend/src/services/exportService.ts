import { api } from './api';
import { downloadBlob } from '../utils/formatters';

export const exportService = {
  /**
   * Downloads pairs of an event in Excel (.xlsx) or CSV (.csv) format, with or without CPF (RF07, RF10, RF11).
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
};
