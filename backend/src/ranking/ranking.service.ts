import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface ItemRanking {
  id: string;
  name: string;
  totalReservations: number;
}

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  // Conta reservas REGISTRADAS, não ativas — cancelamento não tira o setor
  // do ranking (AGENTS.md §3, ESTC-3). Por isso não filtra por status aqui,
  // diferente de `ocupaVaga()` usado em sectors/reservations.
  async obterRanking(): Promise<ItemRanking[]> {
    const setores = await this.prisma.sector.findMany({
      include: { _count: { select: { reservations: true } } },
    });

    return setores
      .map(({ id, name, _count }) => ({
        id,
        name,
        totalReservations: _count.reservations,
      }))
      .sort((a, b) => b.totalReservations - a.totalReservations);
  }
}