export function mensagemDeErro(err: unknown, padrao: string): string {
    const dados = (err as any)?.response?.data;

    return dados?.message || dados?.error || padrao;
}