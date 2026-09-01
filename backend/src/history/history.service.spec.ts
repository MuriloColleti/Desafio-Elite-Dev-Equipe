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

function criarPrismaMock(reservaExiste: boolean, eventos: LinhaDeEvento[]): PrismaService {
  return {
    reservation: {
      findUnique: jest.fn().mockResolvedValue(reservaExiste ? { id: 'reserva-1' } : null),
    },
    reservationEvent: {
      findMany: jest.fn().mockResolvedValue(eventos),
    },
  } as unknown as PrismaService;
}

describe('HistoryService.listarPorReserva', () => {
  it('exibe apenas o evento de criação para uma reserva recém-criada, sem erro', async () => {
    const prisma = criarPrismaMock(true, [evento('CREATED', '2026-09-01T10:00:00.000Z')]);
    const service = new HistoryService(prisma);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico).toHaveLength(1);
    expect(historico[0].type).toBe('CREATED');
  });

  it('exibe os eventos do mais antigo para o mais recente, cada um com data/hora e descrição', async () => {
    const prisma = criarPrismaMock(true, [
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('CANCELLED', '2026-09-01T12:00:00.000Z'),
    ]);
    const service = new HistoryService(prisma);

    const historico = await service.listarPorReserva('reserva-1');

    expect(historico.map((item) => item.type)).toEqual(['CREATED', 'CANCELLED']);
    for (const item of historico) {
      expect(item.occurredAt).toBeInstanceOf(Date);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('inclui a criação da reserva no histórico', async () => {
    const prisma = criarPrismaMock(true, [evento('CREATED', '2026-09-01T10:00:00.000Z')]);
    const service = new HistoryService(prisma);

    const [item] = await service.listarPorReserva('reserva-1');

    expect(item.description).toBe('Reserva criada.');
  });

  it('inclui o cancelamento da reserva no histórico', async () => {
    const prisma = criarPrismaMock(true, [
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('CANCELLED', '2026-09-01T11:00:00.000Z'),
    ]);
    const service = new HistoryService(prisma);

    const historico = await service.listarPorReserva('reserva-1');
    const cancelamento = historico.find((item) => item.type === 'CANCELLED');

    expect(cancelamento?.description).toBe('Reserva cancelada.');
  });

  it('inclui a entrada na lista de espera no histórico', async () => {
    const prisma = criarPrismaMock(true, [
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('WAITLIST_JOINED', '2026-09-01T10:05:00.000Z'),
    ]);
    const service = new HistoryService(prisma);

    const historico = await service.listarPorReserva('reserva-1');
    const entrada = historico.find((item) => item.type === 'WAITLIST_JOINED');

    expect(entrada?.description).toBe('Entrou na lista de espera.');
  });

  it('inclui a saída voluntária da lista de espera no histórico', async () => {
    const prisma = criarPrismaMock(true, [
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('WAITLIST_JOINED', '2026-09-01T10:05:00.000Z'),
      evento('WAITLIST_LEFT', '2026-09-01T10:10:00.000Z'),
    ]);
    const service = new HistoryService(prisma);

    const historico = await service.listarPorReserva('reserva-1');
    const saida = historico.find((item) => item.type === 'WAITLIST_LEFT');

    expect(saida?.description).toBe('Saiu da lista de espera por vontade própria.');
  });

  it('inclui a promoção da lista de espera indicando qual cancelamento a originou', async () => {
    const prisma = criarPrismaMock(true, [
      evento('CREATED', '2026-09-01T10:00:00.000Z'),
      evento('WAITLIST_JOINED', '2026-09-01T10:05:00.000Z'),
      evento('WAITLIST_PROMOTED', '2026-09-01T11:00:00.000Z', 'reserva-999'),
    ]);
    const service = new HistoryService(prisma);

    const historico = await service.listarPorReserva('reserva-1');
    const promocao = historico.find((item) => item.type === 'WAITLIST_PROMOTED');

    expect(promocao?.detail).toBe('reserva-999');
    expect(promocao?.description).toContain('reserva-999');
  });

  it('lança RESERVA_NAO_ENCONTRADA quando a reserva não existe', async () => {
    const prisma = criarPrismaMock(false, []);
    const service = new HistoryService(prisma);

    await expect(service.listarPorReserva('inexistente')).rejects.toThrow(
      ReservaNaoEncontradaError,
    );
  });
});
