/**
 * Forma canônica da placa: maiúsculas, sem hífen nem espaço.
 *
 * Toda a identidade do motorista depende disto — "uma reserva ativa por placa"
 * e a fila única por placa comparam esta forma. Gravar `abc-1d23` e `ABC1D23`
 * faria o mesmo carro valer por dois. Normalize ANTES de gravar e antes de
 * qualquer comparação.
 */
export function normalizarPlaca(placa: string): string {
  return placa.trim().toUpperCase().replace(/[\s-]/g, '');
}
