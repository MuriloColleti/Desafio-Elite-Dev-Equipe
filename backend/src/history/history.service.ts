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
  description: string;
  detail: string | null;
  occurredAt: Date;
}

// A promoção guarda em `detail` o id da reserva cancelada que liberou a vaga
// (AGENTS.md §3, critério da ESTC-5). Quem grava CANCELLED/WAITLIST_PROMOTED
// combina esse valor; aqui só formatamos para leitura.
const DESCREVER_EVENTO: Record<ReservationEventType, (detail: string | null) => string> = {
  CREATED: () => 'Reserva criada.',
  CANCELLED: () => 'Reserva cancelada.',
  CHECKED_IN: () => 'Check-in realizado.',
  CHECKED_OUT: () => 'Check-out realizado.',
  WAITLIST_JOINED: () => 'Entrou na lista de espera.',
  WAITLIST_LEFT: () => 'Saiu da lista de espera por vontade própria.',
  WAITLIST_PROMOTED: (detail) =>
    detail
      ? `Promovido da lista de espera para reserva ativa, com a vaga liberada pelo cancelamento da reserva ${detail}.`
      : 'Promovido da lista de espera para reserva ativa.',
};

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
      description: DESCREVER_EVENTO[evento.type](evento.detail),
    }));
  }
}
