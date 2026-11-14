import { describe, it, expect } from 'vitest';
import {
  formatCPF,
  cleanDigits,
  formatPhone,
  formatDate,
  toInputDateFormat,
  isBeforeToday,
} from '../src/utils/formatters';
import { correspondeABusca } from '../src/utils/participantFilter';
import { mensagemDeErro } from '../src/services/apiError';

describe('Frontend Utils e Formatters', () => {
  describe('formatCPF e cleanDigits', () => {
    it('formata CPF de 11 dígitos corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
    });

    it('lida com valores nulos ou vazios', () => {
      expect(formatCPF('')).toBe('');
      expect(formatCPF(null)).toBe('');
      expect(formatCPF(undefined)).toBe('');
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
  });

  describe('formatDate e isBeforeToday', () => {
    it('formata data YYYY-MM-DD para DD/MM/YYYY sem deslocamento de fuso', () => {
      expect(formatDate('2026-11-15')).toBe('15/11/2026');
    });

    it('valida se evento é anterior a hoje', () => {
      expect(isBeforeToday('2020-01-01')).toBe(true);
      expect(isBeforeToday('2099-12-31')).toBe(false);
    });

    it('converte para input date string', () => {
      expect(toInputDateFormat('2026-11-15T00:00:00.000Z')).toBe('2026-11-15');
      expect(toInputDateFormat('2026-11-15')).toBe('2026-11-15');
    });
  });

  describe('correspondeABusca (Busca por nome e CPF com/sem máscara)', () => {
    const nome = 'João da Silva';
    const cpf = '12345678901';

    it('encontra por substring do nome', () => {
      expect(correspondeABusca(nome, cpf, 'silva')).toBe(true);
      expect(correspondeABusca(nome, cpf, 'joão')).toBe(true);
      expect(correspondeABusca(nome, cpf, 'marcos')).toBe(false);
    });

    it('encontra por CPF limpo (só dígitos)', () => {
      expect(correspondeABusca(nome, cpf, '123456')).toBe(true);
      expect(correspondeABusca(nome, cpf, '8901')).toBe(true);
    });

    it('encontra por CPF formatado com pontuação', () => {
      expect(correspondeABusca(nome, cpf, '123.456')).toBe(true);
      expect(correspondeABusca(nome, cpf, '789-01')).toBe(true);
    });

    it('retorna true para termo vazio', () => {
      expect(correspondeABusca(nome, cpf, '')).toBe(true);
      expect(correspondeABusca(nome, cpf, '   ')).toBe(true);
    });
  });

  describe('mensagemDeErro', () => {
    it('extrai message de resposta tipo Axios', () => {
      const err = {
        isAxiosError: true,
        response: { data: { message: 'Erro customizado da API' } },
      };
      expect(mensagemDeErro(err, 'Padrão')).toBe('Erro customizado da API');
    });

    it('usa mensagem padrão quando não houver dados', () => {
      expect(mensagemDeErro(null, 'Erro padrão')).toBe('Erro padrão');
      expect(mensagemDeErro(new Error('Erro nativo'), 'Padrão')).toBe('Erro nativo');
    });
  });
});

