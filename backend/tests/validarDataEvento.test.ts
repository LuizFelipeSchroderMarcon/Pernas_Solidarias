import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validarDataEvento } from '../src/utils/validarDataEvento';
import { EventService } from '../src/services/eventService';
import { AppError } from '../src/middlewares/errorHandler';

test('aceita uma data válida', () => {
  assert.equal(validarDataEvento('2026-11-15'), true);
});

test('rejeita fevereiro com 30 dias', () => {
  assert.equal(validarDataEvento('2026-02-30'), false);
});

test('rejeita mês inexistente', () => {
  assert.equal(validarDataEvento('2026-13-10'), false);
});

test('rejeita fevereiro 29 em ano não bissexto', () => {
  assert.equal(validarDataEvento('2025-02-29'), false);
});

test('aceita fevereiro 29 em ano bissexto', () => {
  assert.equal(validarDataEvento('2024-02-29'), true);
});

test('rejeita formato incorreto', () => {
  assert.equal(validarDataEvento('15/11/2026'), false);
});

test('rejeita cadastro de evento com data inválida', async () => {
  const service = new EventService();

  await assert.rejects(
    service.create({
      nm_evento: 'Corrida de teste',
      dt_evento: '2026-02-30',
    }),
    (erro: unknown) =>
      erro instanceof AppError && erro.statusCode === 400
  );
});