import { api } from './client';

export interface EntradaEspera {
  id: string;
  plate: string;
  sectorId: string;
  expectedAt: string;
  position: number;
  createdAt: string;
}

export interface NovaEntradaEspera {
  plate: string;
  /** ISO 8601 em UTC — o front converte com toISOString() (AGENTS.md §4.3). */
  expectedAt: string;
}

export function listarEspera(sectorId: string): Promise<EntradaEspera[]> {
  return api.get<EntradaEspera[]>(`/sectors/${sectorId}/waitlist`);
}

export function entrarNaEspera(
  sectorId: string,
  dados: NovaEntradaEspera,
): Promise<EntradaEspera> {
  return api.post<EntradaEspera>(`/sectors/${sectorId}/waitlist`, dados);
}

export function sairDaEspera(id: string): Promise<EntradaEspera> {
  return api.delete<EntradaEspera>(`/waitlist/${id}`);
}
