import axios from 'axios';

export function mensagemDeErro(err: unknown, padrao: string): string {
  if (axios.isAxiosError(err)) {
    const dados = err.response?.data;
    if (dados && typeof dados === 'object') {
      return (dados as any).message || (dados as any).error || padrao;
    }
    if (typeof dados === 'string' && dados.trim()) {
      return dados;
    }
    return err.message || padrao;
  }
  return err instanceof Error ? err.message : padrao;
}
