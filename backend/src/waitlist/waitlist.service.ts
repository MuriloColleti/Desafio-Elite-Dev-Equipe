import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  DataNoPassadoError,
  EsperaNaoEncontradaError,
  PlacaJaNaListaError,
  PlacaJaTemReservaError,
  SetorNaoEncontradoError,
} from "../common/errors";
import { normalizarPlaca } from "../common/plate";
import { ocupaVaga } from "../common/reservation-status";
import { TxClient } from "../common/transaction";
import { HistoryService } from "../history/history.service";
import { PrismaService } from "../prisma/prisma.service";
import { ReservationsService } from "../reservations/reservations.service";
import { CreateWaitlistEntryDto } from "./dto/create-waitlist-entry.dto";

export interface PromocaoResultado {
  reservationId: string;
  plate: string;
}

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly history: HistoryService,
    @Inject(forwardRef(() => ReservationsService))
    private readonly reservations: ReservationsService,
  ) {}

  async entrar(sectorId: string, dto: CreateWaitlistEntryDto) {
    if (dto.expectedAt.getTime() <= Date.now()) {
      throw new DataNoPassadoError();
    }

    const plate = normalizarPlaca(dto.plate);

    if (!plate) {
      throw new PlacaJaTemReservaError();
    }

    return this.prisma.$transaction(async (tx: TxClient) => {
      const setor = await tx.sector.findUnique({
        where: { id: sectorId },
        select: { id: true },
      });

      if (!setor) {
        throw new SetorNaoEncontradoError();
      }

      const reservaAtiva = await tx.reservation.findFirst({
        where: {
          plate,
          ...ocupaVaga(),
        },
        select: { id: true },
      });

      if (reservaAtiva) {
        throw new PlacaJaTemReservaError();
      }

      const jaNaLista = await tx.waitlistEntry.findUnique({
        where: { plate },
        select: { id: true },
      });

      if (jaNaLista) {
        throw new PlacaJaNaListaError();
      }

      for (;;) {
        const ultimaPosicao = await tx.waitlistEntry.aggregate({
          where: { sectorId },
          _max: { position: true },
        });

        const position = (ultimaPosicao._max.position ?? 0) + 1;

        try {
          const entry = await tx.waitlistEntry.create({
            data: {
              plate,
              sectorId,
              expectedAt: dto.expectedAt,
              position,
            },
          });

          return entry;
        } catch (error) {
          if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            continue;
          }

          throw error;
        }
      }
    });
  }

  async listar(sectorId: string) {
    const setor = await this.prisma.sector.findUnique({
      where: { id: sectorId },
      select: { id: true },
    });

    if (!setor) {
      throw new SetorNaoEncontradoError();
    }

    return this.prisma.waitlistEntry.findMany({
      where: { sectorId },
      orderBy: { position: "asc" },
    });
  }

  async sair(id: string) {
    return this.prisma.$transaction(async (tx: TxClient) => {
      const entry = await tx.waitlistEntry.findUnique({
        where: { id },
      });

      if (!entry) {
        throw new EsperaNaoEncontradaError();
      }

      await tx.waitlistEntry.delete({
        where: { id },
      });

      return entry;
    });
  }

  /**
   * Promove o primeiro da fila do setor para reserva ativa, dentro da mesma
   * transação do cancelamento que abriu a vaga (AGENTS.md §4 e §4.1).
   *
   * Recebe `canceladaId` — o id da reserva cancelada que abriu a vaga — só
   * para gravar no histórico da promoção (ESTC-5 exige indicar qual
   * cancelamento a originou). Não participa de nenhuma regra de negócio
   * daqui: cota e ordem da fila não dependem dele.
   */
  async promoverProximo(
    sectorId: string,
    canceladaId: string,
    tx: TxClient,
  ): Promise<PromocaoResultado | null> {
    const proximo = await tx.waitlistEntry.findFirst({
      where: {
        sectorId,
      },
      orderBy: {
        position: "asc",
      },
    });

    if (!proximo) {
      return null;
    }

    const reserva = await this.reservations.criarComTx(
      {
        plate: proximo.plate,
        sectorId: proximo.sectorId,
        expectedAt: proximo.expectedAt,
      },
      tx,
    );

    await tx.waitlistEntry.delete({
      where: {
        id: proximo.id,
      },
    });

    // A reserva promovida já existe nesse ponto, então o evento pode ser
    // gravado com segurança (diferente de WAITLIST_JOINED/WAITLIST_LEFT,
    // que ainda não têm reserva pra apontar — questão em aberto com o grupo).
    await this.history.registrar(
      {
        reservationId: reserva.id,
        type: "WAITLIST_PROMOTED",
        detail: canceladaId,
      },
      tx,
    );

    return {
      reservationId: reserva.id,
      plate: reserva.plate,
    };
  }
}
