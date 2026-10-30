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
    try {
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
        const sanitizedName = eventName
          ? eventName
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/^_+|_+$/g, '')
          : `evento_${eventId}`;

        filename = `relacao_${sanitizedName}_${includeCpf ? 'com_cpf' : 'sem_cpf'}.${extension}`;
      }

      downloadBlob(response.data, filename);
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          err.response.data = JSON.parse(text);
        } catch {
          // ignore
        }
      }
      throw err;
    }
  },
};
