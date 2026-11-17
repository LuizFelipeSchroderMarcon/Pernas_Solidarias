import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validarDataEvento } from '../../src/utils/validarDataEvento';
import { EventService } from '../../src/services/eventService';
import { AppError } from '../../src/middlewares/errorHandler';
import { EventRepository } from '../../src/repositories/eventRepository';

vi.mock('../../src/repositories/eventRepository');

describe('EventService e validarDataEvento', () => {
  let service: EventService;
  let repoMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EventService();
    repoMock = (service as any).eventRepository;
  });

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

  it('rejeita cadastro de evento com data inválida ou campos vazios', async () => {
    await expect(
      service.create({
        nm_evento: 'Corrida de teste',
        dt_evento: '2026-02-30',
      })
    ).rejects.toThrow(AppError);

    await expect(
      service.create({
        nm_evento: '',
        dt_evento: '2026-11-15',
      })
    ).rejects.toThrow(AppError);
  });

  it('deve criar um evento com sucesso', async () => {
    repoMock.create = vi.fn().mockResolvedValue({ cd_evento: 1, nm_evento: 'Corrida 10k', dt_evento: '2026-11-15' });

    const result = await service.create({ nm_evento: 'Corrida 10k', dt_evento: '2026-11-15' });
    expect(result.cd_evento).toBe(1);
  });

  it('deve listar eventos e buscar por ID', async () => {
    repoMock.findAll = vi.fn().mockResolvedValue([{ cd_evento: 1 }]);
    repoMock.findById = vi.fn().mockResolvedValue({ cd_evento: 1 });

    const list = await service.listAll('futuros', 'Corrida');
    expect(list).toHaveLength(1);

    const event = await service.getById(1);
    expect(event.cd_evento).toBe(1);

    repoMock.findById = vi.fn().mockResolvedValue(null);
    await expect(service.getById(99)).rejects.toThrow(AppError);
  });

  it('deve atualizar evento com validações de data e existência', async () => {
    repoMock.findById = vi.fn().mockResolvedValue({ cd_evento: 1 });
    repoMock.update = vi.fn().mockResolvedValue({ cd_evento: 1, nm_evento: 'Atualizado' });

    const updated = await service.update(1, { nm_evento: 'Atualizado', dt_evento: '2026-12-01' });
    expect(updated?.nm_evento).toBe('Atualizado');

    await expect(service.update(1, { nm_evento: 'Atualizado', dt_evento: 'invalid-date' })).rejects.toThrow(AppError);

    repoMock.findById = vi.fn().mockResolvedValue(null);
    await expect(service.update(99, { nm_evento: 'Inexistente', dt_evento: '2026-12-01' })).rejects.toThrow(AppError);
  });

  it('deve remover evento com validação de existência', async () => {
    repoMock.findById = vi.fn().mockResolvedValue({ cd_evento: 1 });
    repoMock.delete = vi.fn().mockResolvedValue(true);

    await expect(service.delete(1)).resolves.not.toThrow();

    repoMock.findById = vi.fn().mockResolvedValue(null);
    await expect(service.delete(99)).rejects.toThrow(AppError);
  });
});