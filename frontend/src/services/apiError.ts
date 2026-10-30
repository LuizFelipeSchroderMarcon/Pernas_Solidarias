export function mensagemDeErro(err: unknown, padrao: string): string {
  const dados = (err as any)?.response?.data;

  if (!dados) {
    return (err as any)?.message || padrao;
  }

  if (typeof dados === 'string') {
    try {
      const parsed = JSON.parse(dados);
      return parsed.message || parsed.error || dados;
    } catch {
      return dados;
    }
  }

  return dados?.message || dados?.error || padrao;
}