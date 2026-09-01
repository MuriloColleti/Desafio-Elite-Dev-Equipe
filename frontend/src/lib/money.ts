const FORMATADOR_BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatarCentavos(cents: number): string {
  return FORMATADOR_BRL.format(cents / 100);
}

/**
 * Converte o que o usuário digitou em reais ("5,50" ou "5.50") para centavos.
 * Retorna `null` quando o texto não é um valor monetário válido — a tela decide
 * a mensagem, esta função não conhece a interface.
 */
export function reaisParaCentavos(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');

  if (normalizado === '' || !/^-?\d*\.?\d*$/.test(normalizado)) {
    return null;
  }

  const valor = Number(normalizado);

  if (!Number.isFinite(valor)) {
    return null;
  }

  return Math.round(valor * 100);
}
