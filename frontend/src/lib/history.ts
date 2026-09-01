import type { TipoEventoHistorico } from '../api/history';

// O back só manda o enum e o detail (AGENTS.md §4.3: "o texto do histórico é
// do front") — a frase em português vive aqui, pra poder corrigir a redação
// sem precisar de migration.
export function descreverEventoHistorico(
  tipo: TipoEventoHistorico,
  detail: string | null,
): string {
  switch (tipo) {
    case 'CREATED':
      return 'Reserva criada.';
    case 'CANCELLED':
      return 'Reserva cancelada.';
    case 'CHECKED_IN':
      return 'Check-in realizado.';
    case 'CHECKED_OUT':
      return 'Check-out realizado.';
    case 'WAITLIST_JOINED':
      return 'Entrou na lista de espera.';
    case 'WAITLIST_LEFT':
      return 'Saiu da lista de espera por vontade própria.';
    case 'WAITLIST_PROMOTED':
      return detail
        ? `Promovido da lista de espera para reserva ativa, com a vaga liberada pelo cancelamento da reserva ${detail}.`
        : 'Promovido da lista de espera para reserva ativa.';
  }
}
