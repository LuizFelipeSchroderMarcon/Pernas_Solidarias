import { Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/exportService';

const exportService = new ExportService();

export class ExportController {
  /**
   * Exports pairs of an event in .xlsx or .csv (RF07, RF10, RF11, RN06).
   */
  async exportEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = parseInt(eventIdParam as string, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      const includeCpf = req.query.comCpf === 'true' || req.query.includeCpf === 'true';
      const format = req.query.formato === 'csv' || req.query.format === 'csv' ? 'csv' : 'xlsx';

      if (format === 'csv') {
        const { csv, filename } = await exportService.generateCsvPairs(eventId, includeCpf);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csv);
      } else {
        const { buffer, filename } = await exportService.generateExcelPairs(eventId, includeCpf);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(Buffer.from(buffer));
      }
    } catch (error) {
      next(error);
    }
  }
}

// Alias for backward compatibility
export { ExportController as ExportacaoController };
