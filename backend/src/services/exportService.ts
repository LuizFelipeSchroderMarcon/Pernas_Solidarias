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
   * Generates an Excel (.xlsx) report of participants for a given event,
   * formatted exactly like the official Corrida Inclusão sheet without the 'Distância' column.
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

    const worksheet = workbook.addWorksheet('Plan1', {
      views: [{ showGridLines: true }],
    });

    const lastColLetter = includeCpf ? 'G' : 'F';
    const numCols = includeCpf ? 7 : 6;

    // 1. Title Banner (Rows 1-2: "PERNAS SOLIDÁRIAS")
    worksheet.mergeCells(`A1:${lastColLetter}2`);
    for (let r = 1; r <= 2; r++) {
      worksheet.getRow(r).height = 15;
      for (let c = 1; c <= numCols; c++) {
        const cell = worksheet.getRow(r).getCell(c);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF9CC2E5' },
        };
      }
    }
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PERNAS SOLIDÁRIAS';
    titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. Event Banner (Rows 3-5: Event Name in uppercase)
    worksheet.mergeCells(`A3:${lastColLetter}5`);
    worksheet.getRow(3).height = 28.5;
    worksheet.getRow(4).height = 15;
    worksheet.getRow(5).height = 15;
    for (let r = 3; r <= 5; r++) {
      for (let c = 1; c <= numCols; c++) {
        const cell = worksheet.getRow(r).getCell(c);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF9CC2E5' },
        };
      }
    }
    const eventCell = worksheet.getCell('A3');
    eventCell.value = event.nm_evento.toUpperCase();
    eventCell.font = { name: 'Calibri', size: 22, bold: true, color: { argb: 'FF000000' } };
    eventCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 6: blank line
    worksheet.getRow(6).height = 15.75;

    // 3. Header Row (Row 7)
    const headers: string[] = ['Quant', 'Atleta', 'Nome completo'];
    if (includeCpf) headers.push('CPF');
    headers.push('Sexo', 'Dta nasc.', 'Camiseta');

    const headerRow = worksheet.getRow(7);
    headerRow.height = 20;
    headers.forEach((h, idx) => {
      const colIndex = idx + 1;
      const cell = headerRow.getCell(colIndex);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
      cell.alignment = {
        horizontal: h === 'Nome completo' ? 'left' : 'center',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: colIndex === 1 ? 'medium' : 'thin', color: { argb: 'FF000000' } },
        right: { style: colIndex === numCols ? 'medium' : 'thin', color: { argb: 'FF000000' } },
      };
    });

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    const applyDataRowStyle = (row: ExcelJS.Row) => {
      row.height = 20;
      for (let c = 1; c <= numCols; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF000000' } };
        cell.border = thinBorder;
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 3 ? 'left' : 'center', // Column 3 is Nome completo
        };
      }
    };

    // 4. Section 1: PCD (Cadeirantes)
    pairs.forEach((pair, index) => {
      const rowData: (string | number)[] = [index + 1, 'PCD', pair.nm_cadeirante];
      if (includeCpf) {
        rowData.push(this.formatCpf(pair.cpf_cadeirante));
      }
      rowData.push(
        this.formatSexo(pair.sexo_cadeirante),
        this.formatDate(pair.data_nascimento_cadeirante),
        pair.tam_camisa_cadeirante
      );

      const row = worksheet.addRow(rowData);
      applyDataRowStyle(row);
    });

    // 5. Blank rows separation between PCD and Condutores
    worksheet.addRow([]);
    worksheet.addRow([]);

    // 6. Section 2: Condutores
    pairs.forEach((pair, index) => {
      const rowData: (string | number)[] = [index + 1, 'Condutor', pair.nm_condutor];
      if (includeCpf) {
        rowData.push(this.formatCpf(pair.cpf_condutor));
      }
      rowData.push(
        this.formatSexo(pair.sexo_condutor),
        this.formatDate(pair.data_nascimento_condutor),
        pair.tam_camisa_condutor
      );

      const row = worksheet.addRow(rowData);
      applyDataRowStyle(row);
    });

    // 7. Column Widths
    worksheet.getColumn(1).width = 8;  // Quant
    worksheet.getColumn(2).width = 12; // Atleta
    worksheet.getColumn(3).width = 38; // Nome completo
    if (includeCpf) {
      worksheet.getColumn(4).width = 18; // CPF
      worksheet.getColumn(5).width = 8;  // Sexo
      worksheet.getColumn(6).width = 14; // Dta nasc.
      worksheet.getColumn(7).width = 14; // Camiseta
    } else {
      worksheet.getColumn(4).width = 8;  // Sexo
      worksheet.getColumn(5).width = 14; // Dta nasc.
      worksheet.getColumn(6).width = 14; // Camiseta
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const sanitizedEventName = this.sanitizeEventName(event.nm_evento);
    const cpfSuffix = includeCpf ? '_com_cpf' : '_sem_cpf';
    const filename = `relacao_${sanitizedEventName}${cpfSuffix}.xlsx`;

    return { buffer, filename };
  }

  /**
   * Generates a CSV formatted report of participants for a given event,
   * matching the structure of the official Corrida Inclusão sheet without the 'Distância' column.
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

    const headers: string[] = ['Quant', 'Atleta', 'Nome completo'];
    if (includeCpf) headers.push('CPF');
    headers.push('Sexo', 'Dta nasc.', 'Camiseta');

    const lines: string[] = [];
    const BOM = '\uFEFF';

    // Title banner in CSV
    lines.push(`"PERNAS SOLIDÁRIAS"`);
    lines.push(`"${event.nm_evento.toUpperCase()}"`);
    lines.push('');

    // Headers
    lines.push(headers.map((h) => `"${h}"`).join(';'));

    // Section 1: PCD
    pairs.forEach((pair, index) => {
      const row: string[] = [
        (index + 1).toString(),
        'PCD',
        pair.nm_cadeirante,
      ];
      if (includeCpf) {
        row.push(this.formatCpf(pair.cpf_cadeirante));
      }
      row.push(
        this.formatSexo(pair.sexo_cadeirante),
        this.formatDate(pair.data_nascimento_cadeirante),
        pair.tam_camisa_cadeirante
      );
      lines.push(row.map((item) => `"${(item || '').replace(/"/g, '""')}"`).join(';'));
    });

    // Spacer
    lines.push('');
    lines.push('');

    // Section 2: Condutor
    pairs.forEach((pair, index) => {
      const row: string[] = [
        (index + 1).toString(),
        'Condutor',
        pair.nm_condutor,
      ];
      if (includeCpf) {
        row.push(this.formatCpf(pair.cpf_condutor));
      }
      row.push(
        this.formatSexo(pair.sexo_condutor),
        this.formatDate(pair.data_nascimento_condutor),
        pair.tam_camisa_condutor
      );
      lines.push(row.map((item) => `"${(item || '').replace(/"/g, '""')}"`).join(';'));
    });

    const sanitizedEventName = this.sanitizeEventName(event.nm_evento);
    const cpfSuffix = includeCpf ? '_com_cpf' : '_sem_cpf';
    const filename = `relacao_${sanitizedEventName}${cpfSuffix}.csv`;

    return { csv: BOM + lines.join('\r\n'), filename };
  }

  private sanitizeEventName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private formatSexo(sexoVal?: string): string {
    if (!sexoVal) return '';
    const clean = sexoVal.trim().toUpperCase();
    if (clean.startsWith('M')) return 'M';
    if (clean.startsWith('F')) return 'F';
    return clean;
  }

  private formatDate(dateVal?: string | Date): string {
    if (!dateVal) return '';
    if (dateVal instanceof Date) {
      if (isNaN(dateVal.getTime())) return '';
      const year = dateVal.getUTCFullYear();
      const month = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateVal.getUTCDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    const str = String(dateVal).split('T')[0];
    const parts = str.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return str;
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
