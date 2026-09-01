import { api } from './client';

export interface Setor {
  id: string;
  name: string;
  location: string;
  quota: number;
  /** Tarifa por hora em centavos (AGENTS.md §8). */
  hourlyRate: number;
  availableQuota: number;
  createdAt: string;
}

export interface NovoSetor {
  name: string;
  location: string;
  quota: number;
  hourlyRate: number;
}

export function listarSetores(): Promise<Setor[]> {
  return api.get<Setor[]>('/sectors');
}

export function criarSetor(dados: NovoSetor): Promise<Setor> {
  return api.post<Setor>('/sectors', dados);
}
