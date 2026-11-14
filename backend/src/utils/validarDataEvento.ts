export function validarDataEvento(data: unknown): boolean {
  if (
    typeof data !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return false;
  }

  const [ano, mes, dia] = data.split('-').map(Number);

  if (ano < 1 || mes < 1 || mes > 12) {
    return false;
  }

  const bissexto =
    ano % 4 === 0 &&
    (ano % 100 !== 0 || ano % 400 === 0);

  const diasPorMes = [
    31,
    bissexto ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return dia >= 1 && dia <= diasPorMes[mes - 1];
}