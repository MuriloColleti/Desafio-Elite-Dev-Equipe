import { api } from './client';

export type TipoEventoHistorico =
  | 'CREATED'
  | 'CANCELLED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'WAITLIST_JOINED'
  | 'WAITLIST_LEFT'
  | 'WAITLIST_PROMOTED';

export interface EventoHistorico {
  id: string;
  type: TipoEventoHistorico;
  detail: string | null;
  occurredAt: string;
}

export function listarHistorico(reservationId: string): Promise<EventoHistorico[]> {
  return api.get<EventoHistorico[]>(`/reservations/${reservationId}/history`);
}
