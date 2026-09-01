import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ReservationEventType } from '@prisma/client';
import { ReservaNaoEncontradaError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { HistoryService } from './history.service';

interface LinhaDeEvento {
  id: string;
  reservationId: string;
  type: ReservationEventType;
  detail: string | null;
  occurredAt: Date;
}

function evento(
  type: ReservationEventType,
  occurredAt: string,
  detail: string | null = null,
): LinhaDeEvento {
  return {
    id: `${type}-${occurredAt}`,
    reservationId: 'reserva-1',
    type,
    detail,
    occurredAt: new Date(occurredAt),
  };
}

describe('HistoryService.listarPorReserva', () => {
  let service: HistoryService;
  let prisma: {
    reservation: { findUnique: jest.Mock<any> };
    reservationEvent: { findMany: jest.Mock<any> };
  };

  beforeEach(async () => {
    prisma = {
      reservation: { findUnique: jest.fn() },
      reservationEvent: { findMany: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [HistoryService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(HistoryService);
  });

  function mockarReserva(existe: boolean): void {
    prisma.reservation.findUnique.mockResolvedValue(
      (existe ? { id: 'reserva-1' } : null) as never,
    );
  }

  it('exibe apenas o evento de criação para uma reserva recém-criada, sem erro', async () => {
    mockarReserva(true);
    prisma.reservationEvent.findMany.mockResolvedValue([
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
    ] as never);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico).toHaveLength(1);
    expect(historico[0].type).toBe('CREATED');
  });

  it('exibe os eventos do mais antigo para o mais recente, cada um com data/hora', async () => {
    mockarReserva(true);
    prisma.reservationEvent.findMany.mockResolvedValue([
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('CANCELLED', '2026-09-01T12:00:00.000Z'),
    ] as never);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico.map((item) => item.type)).toEqual(['CREATED', 'CANCELLED']);
    expect(prisma.reservationEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { occurredAt: 'asc' } }),
    );
    for (const item of historico) {
      expect(item.occurredAt).toBeInstanceOf(Date);
    }
  });

  it('inclui a criação da reserva no histórico', async () => {
    mockarReserva(true);
    prisma.reservationEvent.findMany.mockResolvedValue([
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
    ] as never);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico.some((item) => item.type === 'CREATED')).toBe(true);
  });

  it('inclui o cancelamento da reserva no histórico', async () => {
    mockarReserva(true);
    prisma.reservationEvent.findMany.mockResolvedValue([
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('CANCELLED', '2026-09-01T11:00:00.000Z'),
    ] as never);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico.some((item) => item.type === 'CANCELLED')).toBe(true);
  });

  it('inclui a entrada na lista de espera no histórico', async () => {
    mockarReserva(true);
    prisma.reservationEvent.findMany.mockResolvedValue([
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('WAITLIST_JOINED', '2026-09-01T10:05:00.000Z'),
    ] as never);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico.some((item) => item.type === 'WAITLIST_JOINED')).toBe(true);
  });

  it('inclui a saída voluntária da lista de espera no histórico', async () => {
    mockarReserva(true);
    prisma.reservationEvent.findMany.mockResolvedValue([
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('WAITLIST_JOINED', '2026-09-01T10:05:00.000Z'),
      evento('WAITLIST_LEFT', '2026-09-01T10:10:00.000Z'),
    ] as never);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico.some((item) => item.type === 'WAITLIST_LEFT')).toBe(true);
  });

  it('inclui a promoção da lista de espera indicando qual cancelamento a originou', async () => {
    mockarReserva(true);
    prisma.reservationEvent.findMany.mockResolvedValue([
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('WAITLIST_JOINED', '2026-09-01T10:05:00.000Z'),
      evento('WAITLIST_PROMOTED', '2026-09-01T11:00:00.000Z', 'reserva-999'),
    ] as never);

    const historico = await service.listarPorReserva('reserva-1');
    const promocao = historico.find((item) => item.type === 'WAITLIST_PROMOTED');

    expect(promocao?.detail).toBe('reserva-999');
  });

  it('lança RESERVA_NAO_ENCONTRADA quando a reserva não existe', async () => {
    mockarReserva(false);

    await expect(service.listarPorReserva('inexistente')).rejects.toThrow(
      ReservaNaoEncontradaError,
    );
  });
});
