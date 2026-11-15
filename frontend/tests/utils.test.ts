import { describe, it, expect, vi } from 'vitest';
import {
  formatCPF,
  cleanDigits,
  formatPhone,
  formatDate,
  toInputDateFormat,
  isBeforeToday,
  downloadBlob,
} from '../src/utils/formatters';
import { correspondeABusca } from '../src/utils/participantFilter';
import { mensagemDeErro } from '../src/services/apiError';

describe('Frontend Utils e Formatters', () => {
  describe('formatCPF e cleanDigits', () => {
    it('formata CPF de 11 dígitos corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
    });

    it('formata CPF parcial com 3, 6 e 9 dígitos', () => {
      expect(formatCPF('123')).toBe('123');
      expect(formatCPF('123456')).toBe('123.456');
      expect(formatCPF('123456789')).toBe('123.456.789');
    });

    it('lida com valores nulos ou vazios', () => {
      expect(formatCPF('')).toBe('');
      expect(formatCPF(null)).toBe('');
      expect(formatCPF(undefined)).toBe('');
      expect(cleanDigits('')).toBe('');
      expect(cleanDigits(null)).toBe('');
      expect(cleanDigits(undefined)).toBe('');
    });

    it('remove caracteres não numéricos', () => {
      expect(cleanDigits('123.456.789-01')).toBe('12345678901');
      expect(cleanDigits('(47) 99999-8888')).toBe('47999998888');
    });
  });

  describe('formatPhone', () => {
    it('formata telefone celular de 11 dígitos', () => {
      expect(formatPhone('47999998888')).toBe('(47) 99999-8888');
    });

    it('formata telefone fixo de 10 dígitos', () => {
      expect(formatPhone('4733334444')).toBe('(47) 3333-4444');
    });

    it('lida com parciais e vazios', () => {
      expect(formatPhone('')).toBe('');
      expect(formatPhone(null)).toBe('');
      expect(formatPhone('47')).toBe('47');
      expect(formatPhone('479999')).toBe('(47) 9999');
    });
  });

  describe('formatDate, toInputDateFormat e isBeforeToday', () => {
    it('formata data YYYY-MM-DD para DD/MM/YYYY sem deslocamento de fuso', () => {
      expect(formatDate('2026-11-15')).toBe('15/11/2026');
    });

    it('formata Date object e datas ISO', () => {
      const d = new Date('2026-05-10T12:00:00Z');
      expect(formatDate(d)).toBeDefined();
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('invalido')).toBe('invalido');
    });

    it('toInputDateFormat converte string e Date', () => {
      expect(toInputDateFormat('')).toBe('');
      expect(toInputDateFormat('2026-11-15')).toBe('2026-11-15');
      expect(toInputDateFormat('2026-11-15T15:30:00Z')).toBe('2026-11-15');
      expect(toInputDateFormat(new Date('2026-11-15T00:00:00.000Z'))).toBe('2026-11-15');
    });

    it('valida se evento é anterior a hoje', () => {
      expect(isBeforeToday('2020-01-01')).toBe(true);
      expect(isBeforeToday('2099-12-31')).toBe(false);
      expect(isBeforeToday(null)).toBe(false);
    });
  });

  describe('downloadBlob', () => {
    it('deve simular download de blob no DOM', () => {
      const mockClick = vi.fn();
      const mockAppend = vi.fn();
      const mockRemove = vi.fn();

      vi.stubGlobal('window', {
        URL: {
          createObjectURL: vi.fn().mockReturnValue('blob:url'),
          revokeObjectURL: vi.fn(),
        },
      });

      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue({
          set href(val: string) {},
          set download(val: string) {},
          click: mockClick,
        }),
        body: {
          appendChild: mockAppend,
          removeChild: mockRemove,
        },
      });

      const blob = new Blob(['dados']);
      downloadBlob(blob, 'arquivo.xlsx');

      expect(mockClick).toHaveBeenCalled();
      expect(mockAppend).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('correspondeABusca', () => {
    it('encontra por nome ignorando maiúsculas e minúsculas', () => {
      expect(correspondeABusca('João da Silva', '123.456.789-01', 'joão')).toBe(true);
      expect(correspondeABusca('João da Silva', '123.456.789-01', 'SILVA')).toBe(true);
    });

    it('encontra por CPF mesmo digitando sem pontuação', () => {
      expect(correspondeABusca('João da Silva', '123.456.789-01', '123456')).toBe(true);
    });

    it('retorna false quando não há correspondência', () => {
      expect(correspondeABusca('João da Silva', '123.456.789-01', 'Maria')).toBe(false);
    });

    it('retorna true para busca vazia', () => {
      expect(correspondeABusca('João da Silva', '123.456.789-01', '')).toBe(true);
      expect(correspondeABusca('João da Silva', '123.456.789-01', '   ')).toBe(true);
    });
  });
});