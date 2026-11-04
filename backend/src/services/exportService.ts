import ExcelJS from 'exceljs';
import { PairRepository } from '../repositories/pairRepository';
import { EventRepository } from '../repositories/eventRepository';
import { AppError } from '../middlewares/errorHandler';

export class ExportService {
  private pairRepository: PairRepository;
  private eventRepository: EventRepository;

  constructor() {
    this.pairRepository = new PairRepository();
    this.eventRepository = new EventRepository();
  }

  /**
   * Generates an Excel (.xlsx) report of pairs for a given event (RF07, RF10, RF11, RN06).
   */
  async generateExcelPairs(
    eventId: number,
    includeCpf: boolean = false
  ): Promise<{ buffer: ExcelJS.Buffer; filename: string }> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado para exportação.', 404);
    }

    const pairs = await this.pairRepository.findByEventId(eventId);
    if (pairs.length === 0) {
      throw new AppError('Este evento ainda não possui duplas formadas para exportação.', 400);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pernas Solidárias';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Duplas Formadas', {
      views: [{ showGridLines: true }],
    });

    const formattedDate = new Date(event.dt_evento).toLocaleDateString('pt-BR');

    // 1. Title Banner
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `PERNAS SOLIDÁRIAS — ${event.nm_evento.toUpperCase()} (${formattedDate})`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 32;

    // 2. Subtitle with metrics
    worksheet.mergeCells('A2:H2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Total de duplas formadas: ${pairs.length} | Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]); // Blank line

    // 3. Column Headers
    const headers: string[] = ['Nº Dupla', 'Cadeirante'];
    if (includeCpf) headers.push('CPF Cadeirante');
    headers.push('Telefone Cadeirante', 'Tam. Camisa', 'Cadeira Própria', 'Condutor');
    if (includeCpf) headers.push('CPF Condutor');
    headers.push('Telefone Condutor', 'Tam. Camisa');

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });

    // 4. Fill rows
    pairs.forEach((pair, index) => {
      const rowData: (string | number)[] = [index + 1, pair.nm_cadeirante];

      if (includeCpf) {
        rowData.push(this.formatCpf(pair.cpf_cadeirante));
      }

      rowData.push(
        pair.telefone_cadeirante || '-',
        pair.tam_camisa_cadeirante,
        pair.possui_cadeira_propria ? 'Sim' : 'Não',
        pair.nm_condutor
      );

      if (includeCpf) {
        rowData.push(this.formatCpf(pair.cpf_condutor));
      }

      rowData.push(pair.telefone_condutor || '-', pair.tam_camisa_condutor);

      const row = worksheet.addRow(rowData);
      row.height = 22;

      const isEven = index % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 || colNumber === 5 || colNumber === 6 ? 'center' : 'left',
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FAFB' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    // 5. Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const length = cell.value ? cell.value.toString().length : 0;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.max(maxLength + 4, 12);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const sanitizedEventName = event.nm_evento.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cpfSuffix = includeCpf ? '_com_cpf' : '_sem_cpf';
    const filename = `duplas_${sanitizedEventName}${cpfSuffix}.xlsx`;

    return { buffer, filename };
  }

  /**
   * Generates a CSV formatted report of pairs for a given event (RF07).
   */
  async generateCsvPairs(
    eventId: number,
    includeCpf: boolean = false
  ): Promise<{ csv: string; filename: string }> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado para exportação.', 404);
    }

    const pairs = await this.pairRepository.findByEventId(eventId);
    if (pairs.length === 0) {
      throw new AppError('Este evento ainda não possui duplas formadas para exportação.', 400);
    }

    const headers: string[] = ['Nº Dupla', 'Nome Cadeirante'];
    if (includeCpf) headers.push('CPF Cadeirante');
    headers.push('Telefone Cadeirante', 'Tam. Camisa Cadeirante', 'Cadeira Própria', 'Nome Condutor');
    if (includeCpf) headers.push('CPF Condutor');
    headers.push('Telefone Condutor', 'Tam. Camisa Condutor');

    const lines: string[] = [];
    const BOM = '\uFEFF';

    lines.push(headers.map((h) => `"${h}"`).join(';'));

    pairs.forEach((pair, index) => {
      const row: string[] = [
        (index + 1).toString(),
        pair.nm_cadeirante,
      ];

      if (includeCpf) {
        row.push(this.formatCpf(pair.cpf_cadeirante));
      }

      row.push(
        pair.telefone_cadeirante || '',
        pair.tam_camisa_cadeirante,
        pair.possui_cadeira_propria ? 'Sim' : 'Não',
        pair.nm_condutor
      );

      if (includeCpf) {
        row.push(this.formatCpf(pair.cpf_condutor));
      }

      row.push(pair.telefone_condutor || '', pair.tam_camisa_condutor);

      lines.push(row.map((item) => `"${item.replace(/"/g, '""')}"`).join(';'));
    });

    const sanitizedEventName = event.nm_evento.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cpfSuffix = includeCpf ? '_com_cpf' : '_sem_cpf';
    const filename = `duplas_${sanitizedEventName}${cpfSuffix}.csv`;

    return { csv: BOM + lines.join('\r\n'), filename };
  }

  private formatCpf(cpf?: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
}

// Alias for backward compatibility
export { ExportService as ExportacaoService };
