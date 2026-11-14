import { describe, it, expect } from 'vitest';
import { validarDataEvento } from '../../src/utils/validarDataEvento';
import { EventService } from '../../src/services/eventService';
import { AppError } from '../../src/middlewares/errorHandler';

describe('EventService e validarDataEvento', () => {
  it('aceita uma data válida', () => {
    expect(validarDataEvento('2026-11-15')).toBe(true);
  });

  it('rejeita fevereiro com 30 dias', () => {
    expect(validarDataEvento('2026-02-30')).toBe(false);
  });

  it('rejeita mês inexistente', () => {
    expect(validarDataEvento('2026-13-10')).toBe(false);
  });

  it('rejeita fevereiro 29 em ano não bissexto', () => {
    expect(validarDataEvento('2025-02-29')).toBe(false);
  });

  it('aceita fevereiro 29 em ano bissexto', () => {
    expect(validarDataEvento('2024-02-29')).toBe(true);
  });

  it('rejeita formato incorreto', () => {
    expect(validarDataEvento('15/11/2026')).toBe(false);
    expect(validarDataEvento(null)).toBe(false);
    expect(validarDataEvento(undefined)).toBe(false);
    expect(validarDataEvento(123)).toBe(false);
  });

  it('rejeita cadastro de evento com data inválida', async () => {
    const service = new EventService();

    await expect(
      service.create({
        nm_evento: 'Corrida de teste',
        dt_evento: '2026-02-30',
      })
    ).rejects.toThrow(AppError);
  });
});

