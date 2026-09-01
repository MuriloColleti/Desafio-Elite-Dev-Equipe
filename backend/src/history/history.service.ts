import { Injectable } from '@nestjs/common';
import { ReservationEventType } from '@prisma/client';
import { TxClient } from '../common/transaction';

export interface EventoRegistrado {
  reservationId: string;
  type: ReservationEventType;
  detail?: string;
}

@Injectable()
export class HistoryService {
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
}
