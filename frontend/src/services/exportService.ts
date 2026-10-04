import { api } from './api';
import { downloadBlob } from '../utils/formatters';

export const exportService = {
  /**
   * Downloads pairs of an event in Excel (.xlsx) or CSV (.csv) format, with or without CPF.
   */
  async exportEventReport(eventId: number, includeCpf: boolean, format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
    const response = await api.get(`/export/event/${eventId}`, {
      params: {
        includeCpf,
        format,
      },
      responseType: 'blob',
    });

    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const filename = `duplas_evento_${eventId}_${includeCpf ? 'com_cpf' : 'sem_cpf'}.${extension}`;
    downloadBlob(response.data, filename);
  },
};
