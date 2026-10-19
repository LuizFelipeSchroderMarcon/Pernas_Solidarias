export function cpfValido(cpf: string): boolean {
  const numeros = String(cpf).replace(/\D/g, '');

  if (numeros.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(numeros)) {
    return false;
  }

  const calcularDigitoVerificador = (base: string): number => {
    let soma = 0;
    let peso = base.length + 1;

    for (const digito of base) {
      soma += Number(digito) * peso;
      peso--;
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  };

  const primeirosNoveDigitos = numeros.slice(0, 9);
  const primeiroDigitoVerificador = calcularDigitoVerificador(primeirosNoveDigitos);

  const primeirosDezDigitos = primeirosNoveDigitos + String(primeiroDigitoVerificador);
  const segundoDigitoVerificador = calcularDigitoVerificador(primeirosDezDigitos);

  return (
    Number(numeros[9]) === primeiroDigitoVerificador &&
    Number(numeros[10]) === segundoDigitoVerificador
  );
}