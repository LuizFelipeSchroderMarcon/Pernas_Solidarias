import { cleanDigits } from './formatters';

/**
 * A tabela mostra o CPF formatado (000.000.000-00), mas o banco guarda só os
 * dígitos. Quando o termo parece um CPF (só números, pontos, traço ou espaços),
 * a comparação usa apenas os dígitos, para a busca funcionar com ou sem máscara.
 */
export function correspondeABusca(
  nome: string,
  cpf: string | null | undefined,
  termo: string
): boolean {
  const termoNormalizado = termo.trim().toLowerCase();
  if (!termoNormalizado) return true;
  if (nome.toLowerCase().includes(termoNormalizado)) return true;

  const pareceCpf = /^[\d.\-\s]+$/.test(termoNormalizado);
  const digitos = cleanDigits(termoNormalizado);
  return pareceCpf && digitos !== '' && !!cpf && cleanDigits(cpf).includes(digitos);
}

