import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportService } from '../../src/services/exportService';
import { EventRepository } from '../../src/repositories/eventRepository';
import { PairRepository } from '../../src/repositories/pairRepository';
import { AppError } from '../../src/middlewares/errorHandler';

vi.mock('../../src/repositories/eventRepository');
vi.mock('../../src/repositories/pairRepository');

describe('ExportService Unit Tests', () => {
  let exportService: ExportService;
  let eventRepoMock: any;
  let pairRepoMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    exportService = new ExportService();
    eventRepoMock = (exportService as any).eventRepository;
    pairRepoMock = (exportService as any).pairRepository;
  });

  const mockEvent = {
    cd_evento: 1,
    nm_evento: 'Corrida Inclusão 2026',
    dt_evento: '2026-05-10',
    local_evento: 'Parque Ibirapuera',
    ativo: true,
  };

  const mockPairs = [
    {
      cd_dupla: 10,
      cd_evento: 1,
      cd_cadeirante: 1,
      nm_cadeirante: 'Carlos Silva',
      cpf_cadeirante: '12345678901',
      sexo_cadeirante: 'M',
      data_nascimento_cadeirante: '1995-04-12',
      tam_camisa_cadeirante: 'M',
      cd_condutor: 2,
      nm_condutor: 'Mariana Costa',
      cpf_condutor: '98765432100',
      sexo_condutor: 'F',
      data_nascimento_condutor: new Date('1990-08-20T00:00:00.000Z'),
      tam_camisa_condutor: 'G',
    },
    {
      cd_dupla: 11,
      cd_evento: 1,
      cd_cadeirante: 3,
      nm_cadeirante: 'Ana "Super" Pereira',
      cpf_cadeirante: '11122233344',
      sexo_cadeirante: 'feminino',
      data_nascimento_cadeirante: 'invalid-date',
      tam_camisa_cadeirante: 'P',
      cd_condutor: 4,
      nm_condutor: 'Pedro Santos',
      cpf_condutor: '',
      sexo_condutor: 'masculino',
      data_nascimento_condutor: new Date(NaN),
      tam_camisa_condutor: 'GG',
    },
  ];

  describe('generateExcelPairs', () => {
    it('deve lançar AppError 404 se evento não existir', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(null);

      await expect(exportService.generateExcelPairs(99)).rejects.toThrow(AppError);
    });

    it('deve lançar AppError 400 se não houver duplas no evento', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(mockEvent);
      pairRepoMock.findByEventId = vi.fn().mockResolvedValue([]);

      await expect(exportService.generateExcelPairs(1)).rejects.toThrow(AppError);
    });

    it('deve gerar planilha Excel com sucesso sem CPF', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(mockEvent);
      pairRepoMock.findByEventId = vi.fn().mockResolvedValue(mockPairs);

      const result = await exportService.generateExcelPairs(1, false);

      expect(result).toHaveProperty('buffer');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toContain('corrida_inclusao_2026_sem_cpf.xlsx');
    });

    it('deve gerar planilha Excel com sucesso incluindo CPF', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(mockEvent);
      pairRepoMock.findByEventId = vi.fn().mockResolvedValue(mockPairs);

      const result = await exportService.generateExcelPairs(1, true);

      expect(result.buffer).toBeDefined();
      expect(result.filename).toContain('corrida_inclusao_2026_com_cpf.xlsx');
    });
  });

  describe('generateCsvPairs', () => {
    it('deve lançar erro se evento não existir', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(null);

      await expect(exportService.generateCsvPairs(99)).rejects.toThrow(AppError);
    });

    it('deve lançar erro se não houver duplas', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(mockEvent);
      pairRepoMock.findByEventId = vi.fn().mockResolvedValue([]);

      await expect(exportService.generateCsvPairs(1)).rejects.toThrow(AppError);
    });

    it('deve gerar arquivo CSV com cabeçalhos e BOM sem CPF', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(mockEvent);
      pairRepoMock.findByEventId = vi.fn().mockResolvedValue(mockPairs);

      const result = await exportService.generateCsvPairs(1, false);

      expect(result.filename).toContain('corrida_inclusao_2026_sem_cpf.csv');
      expect(result.csv).toContain('\uFEFF');
      expect(result.csv).toContain('"PERNAS SOLIDÁRIAS"');
      expect(result.csv).toContain('"CORRIDA INCLUSÃO 2026"');
      expect(result.csv).toContain('"Carlos Silva"');
      expect(result.csv).not.toContain('123.456.789-01');
    });

    it('deve gerar arquivo CSV incluindo coluna e dados de CPF', async () => {
      eventRepoMock.findById = vi.fn().mockResolvedValue(mockEvent);
      pairRepoMock.findByEventId = vi.fn().mockResolvedValue(mockPairs);

      const result = await exportService.generateCsvPairs(1, true);

      expect(result.filename).toContain('corrida_inclusao_2026_com_cpf.csv');
      expect(result.csv).toContain('"CPF"');
      expect(result.csv).toContain('123.456.789-01');
      expect(result.csv).toContain('987.654.321-00');
    });
  });

  describe('Funções de formatação internas', () => {
    it('deve cobrir formatações de data, sexo e CPF com valores nulos ou atípicos', () => {
      const anyService = exportService as any;

      expect(anyService.formatSexo(undefined)).toBe('');
      expect(anyService.formatSexo('outro')).toBe('OUTRO');

      expect(anyService.formatDate(undefined)).toBe('');
      expect(anyService.formatDate('2026-11-15')).toBe('15/11/2026');

      expect(anyService.formatCpf(undefined)).toBe('');
      expect(anyService.formatCpf('12345')).toBe('12345');

      expect(anyService.sanitizeEventName('___Evento Especial! 2026___')).toBe('evento_especial_2026');
    });
  });
});