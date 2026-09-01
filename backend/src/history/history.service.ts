import { Injectable } from '@nestjs/common';
import { ReservationEventType } from '@prisma/client';
import { ReservaNaoEncontradaError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { TxClient } from '../common/transaction';

export interface EventoRegistrado {
  reservationId: string;
  type: ReservationEventType;
  detail?: string;
}

export interface EventoHistorico {
  id: string;
  type: ReservationEventType;
  detail: string | null;
  occurredAt: Date;
}

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Grava um evento no histórico da reserva (ESTC-5).
   *
   * Recebe `tx` porque o evento precisa nascer e morrer junto da operação que o
   * originou: se a reserva sofrer rollback, o evento não pode sobreviver.
   * Chame sempre daqui — não monte `reservationEvent` na mão em outro módulo.
   */
  async registrar(evento: EventoRegistrado, tx: TxClient): Promise<void> {
    await tx.reservationEvent.create({
      data: {
        reservationId: evento.reservationId,
        type: evento.type,
        detail: evento.detail ?? null,
      },
    });
  }

  // O enum e o `detail` (id da reserva cancelada, na promoção) são tudo que
  // sai daqui — a frase em português vive no front (AGENTS.md §4.3).
  async listarPorReserva(reservationId: string): Promise<EventoHistorico[]> {
    const reserva = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true },
    });

    if (!reserva) {
      throw new ReservaNaoEncontradaError();
    }

    const eventos = await this.prisma.reservationEvent.findMany({
      where: { reservationId },
      orderBy: { occurredAt: 'asc' },
    });

    return eventos.map((evento) => ({
      id: evento.id,
      type: evento.type,
      detail: evento.detail,
      occurredAt: evento.occurredAt,
    }));
  }
}
