import { api } from "./client";

export interface RankingItem {
  id: string;
  name: string;
  totalReservations: number;
}

export function getRanking(): Promise<RankingItem[]> {
  return api.get<RankingItem[]>('/ranking');
}