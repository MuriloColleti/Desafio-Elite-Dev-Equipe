import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { RankingService } from './ranking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RankingService', () => {
  let service: RankingService;
  let prisma: { sector: { findMany: jest.Mock<any> } };

  beforeEach(async () => {
    prisma = { sector: { findMany: jest.fn() } };

    const module = await Test.createTestingModule({
      providers: [
        RankingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(RankingService);
  });

  it('ordena setores pela quantidade de reservas, do maior pro menor', async () => {
    prisma.sector.findMany.mockResolvedValue([
        { id: '1', name: 'Setor A', _count: { reservations: 2 } },
        { id: '2', name: 'Setor B', _count: { reservations: 5 } },
    ] as never);
    const resultado = await service.obterRanking();

    expect(resultado.map((r) => r.id)).toEqual(['2', '1']);
  });

  it('retorna lista vazia quando não há setores', async () => {
    prisma.sector.findMany.mockResolvedValue([] as never);

    const resultado = await service.obterRanking();

    expect(resultado).toEqual([]);
  });

  it('inclui setor sem nenhuma reserva com total zero', async () => {
    prisma.sector.findMany.mockResolvedValue([
      { id: '1', name: 'Setor A', _count: { reservations: 0 } },
    ] as never);

    const resultado = await service.obterRanking();

    expect(resultado[0].totalReservations).toBe(0);
  });
});