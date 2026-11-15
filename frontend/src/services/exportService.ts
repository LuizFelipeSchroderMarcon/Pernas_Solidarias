import { api } from './api';
import { downloadBlob } from '../utils/formatters';

export const exportService = {
  /**
   * Downloads pairs of an event in Excel (.xlsx) or CSV (.csv) format, with or without CPF.
   */
  async exportEventReport(
    eventId: number,
    includeCpf: boolean,
    format: 'xlsx' | 'csv' = 'xlsx',
    eventName?: string
  ): Promise<void> {
    const response = await api.get(`/export/event/${eventId}`, {
      params: {
        includeCpf,
        format,
      },
      responseType: 'blob',
    });

    const extension = format === 'csv' ? 'csv' : 'xlsx';

    let filename = '';
    const disposition = response.headers?.['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    if (!filename) {
      let sanitizedName = `evento_${eventId}`;
      if (eventName) {
        const clean = eventName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_');

        let start = 0;
        while (start < clean.length && clean[start] === '_') {
          start++;
        }
        let end = clean.length;
        while (end > start && clean[end - 1] === '_') {
          end--;
        }
        sanitizedName = clean.slice(start, end) || `evento_${eventId}`;
      }

      filename = `relacao_${sanitizedName}_${includeCpf ? 'com_cpf' : 'sem_cpf'}.${extension}`;
    }

    downloadBlob(response.data, filename);
  },
};
