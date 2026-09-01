import { api } from './client';

export type ReservationStatus = 'AGENDADO' | 'EM_USO' | 'CONCLUIDO' | 'CANCELADO';

export interface Reserva {
  id: string;
  plate: string;
  sectorId: string;
  expectedAt: string;
  status: ReservationStatus;
  createdAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledAt: string | null;
}

export interface NovaReserva {
  plate: string;
  sectorId: string;
  /** ISO 8601 em UTC — o front converte com toISOString() (AGENTS.md §4.3). */
  expectedAt: string;
}

export function criarReserva(dados: NovaReserva): Promise<Reserva> {
  return api.post<Reserva>('/reservations', dados);
}

export function listarReservasPorPlaca(plate: string): Promise<Reserva[]> {
  return api.get<Reserva[]>(`/reservations?plate=${encodeURIComponent(plate)}`);
}

export function cancelarReserva(id: string): Promise<Reserva> {
  return api.patch<Reserva>(`/reservations/${id}/cancel`);
}

export function fazerCheckIn(id: string): Promise<Reserva> {
  return api.patch<Reserva>(`/reservations/${id}/check-in`);
}

export function fazerCheckOut(id: string): Promise<Reserva> {
  return api.patch<Reserva>(`/reservations/${id}/check-out`);
}
