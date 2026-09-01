import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Reservation, ReservationEventType, ReservationStatus } from '@prisma/client';
import {
  DataNoPassadoError,
  PlacaJaTemReservaError,
  ReservaNaoEncontradaError,
  SetorSemCotaError,
  TransicaoInvalidaError,
  ValidacaoError,
} from '../common/errors';
import { normalizarPlaca } from '../common/plate';
import { ocupaVaga } from '../common/reservation-status';
import { TxClient } from '../common/transaction';
import { HistoryService } from '../history/history.service';
import { PrismaService } from '../prisma/prisma.service';
import { SectorsService } from '../sectors/sectors.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

export interface ReservaResponse {
  id: string;
  plate: string;
  sectorId: string;
  expectedAt: Date;
  status: ReservationStatus;
  createdAt: Date;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  cancelledAt: Date | null;
}

export interface DadosNovaReserva {
  plate: string;
  sectorId: string;
  expectedAt: Date;
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sectors: SectorsService,
    private readonly history: HistoryService,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlist: WaitlistService,
  ) {}

  async criar(dto: CreateReservationDto): Promise<ReservaResponse> {
    if (dto.expectedAt.getTime() <= Date.now()) {
      throw new DataNoPassadoError();
    }

    const plate = normalizarPlaca(dto.plate);

    if (!plate) {
      throw new ValidacaoError('A placa é obrigatória.');
    }

    return this.prisma.$transaction(async (tx) => {
      const reservaAtiva = await tx.reservation.findFirst({
        where: { plate, ...ocupaVaga() },
      });

      if (reservaAtiva) {
        throw new PlacaJaTemReservaError();
      }

      // Lança SetorNaoEncontradoError se o setor não existir.
      const disponivel = await this.sectors.obterCotaDisponivel(dto.sectorId, tx);

      if (disponivel <= 0) {
        throw new SetorSemCotaError();
      }

      return this.criarComTx({ plate, sectorId: dto.sectorId, expectedAt: dto.expectedAt }, tx);
    });
  }

  /**
   * Insere a reserva (AGENDADO) e grava o evento de criação, sem checar placa
   * duplicada nem cota — quem chama já garantiu essas condições no próprio
   * contexto. É o método que a ESTC-4 reusa para promover a fila (AGENTS.md
   * §4.3): a promoção não recheca cota porque ela "não muda" por construção,
   * e a placa que estava esperando não tem reserva ativa por definição.
   */
  async criarComTx(dados: DadosNovaReserva, tx: TxClient): Promise<ReservaResponse> {
    const reserva = await tx.reservation.create({
      data: {
        plate: dados.plate,
        sectorId: dados.sectorId,
        expectedAt: dados.expectedAt,
      },
    });

    await this.history.registrar(
      { reservationId: reserva.id, type: ReservationEventType.CREATED },
      tx,
    );

    return this.paraResponse(reserva);
  }

  async listar(plate?: string, sectorId?: string): Promise<ReservaResponse[]> {
    const reservas = await this.prisma.reservation.findMany({
      where: {
        ...(plate ? { plate: normalizarPlaca(plate) } : {}),
        ...(sectorId ? { sectorId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservas.map((reserva) => this.paraResponse(reserva));
  }

  async buscarPorId(id: string): Promise<ReservaResponse> {
    const reserva = await this.prisma.reservation.findUnique({ where: { id } });

    if (!reserva) {
      throw new ReservaNaoEncontradaError();
    }

    return this.paraResponse(reserva);
  }

  async cancelar(id: string): Promise<ReservaResponse> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.reservation.updateMany({
        where: { id, ...ocupaVaga() },
        data: { status: ReservationStatus.CANCELADO, cancelledAt: new Date() },
      });

      if (count === 0) {
        await this.exigirQueExista(id, tx);
        throw new TransicaoInvalidaError('Esta reserva não está ativa e não pode ser cancelada.');
      }

      const reserva = await tx.reservation.findUniqueOrThrow({ where: { id } });

      await this.history.registrar(
        { reservationId: id, type: ReservationEventType.CANCELLED },
        tx,
      );

      // Gancho para a fila de espera (ESTC-4, AGENTS.md §4): quem preencher o
      // corpo decide se promove alguém; a cota, por ser derivada, se ajusta
      // sozinha nos dois casos.
      await this.waitlist.promoverProximo(reserva.sectorId, tx);

      return this.paraResponse(reserva);
    });
  }

  async checkIn(id: string): Promise<ReservaResponse> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.reservation.updateMany({
        where: { id, status: ReservationStatus.AGENDADO },
        data: { status: ReservationStatus.EM_USO, checkedInAt: new Date() },
      });

      if (count === 0) {
        await this.exigirQueExista(id, tx);
        throw new TransicaoInvalidaError('Só é possível fazer check-in de uma reserva agendada.');
      }

      await this.history.registrar(
        { reservationId: id, type: ReservationEventType.CHECKED_IN },
        tx,
      );

      return this.paraResponse(await tx.reservation.findUniqueOrThrow({ where: { id } }));
    });
  }

  async checkOut(id: string): Promise<ReservaResponse> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.reservation.updateMany({
        where: { id, status: ReservationStatus.EM_USO },
        data: { status: ReservationStatus.CONCLUIDO, checkedOutAt: new Date() },
      });

      if (count === 0) {
        await this.exigirQueExista(id, tx);
        throw new TransicaoInvalidaError('Só é possível fazer check-out de uma reserva em uso.');
      }

      await this.history.registrar(
        { reservationId: id, type: ReservationEventType.CHECKED_OUT },
        tx,
      );

      return this.paraResponse(await tx.reservation.findUniqueOrThrow({ where: { id } }));
    });
  }

  /**
   * Só entra quando o `updateMany` condicional afeta 0 linhas, pra decidir
   * entre 404 (reserva não existe) e 409 (existe, mas no estado errado) sem
   * ler antes de escrever (AGENTS.md §9) — o `updateMany` continua sendo a
   * única fonte de verdade sobre o resultado da transição.
   */
  private async exigirQueExista(id: string, tx: TxClient): Promise<void> {
    const existe = await tx.reservation.findUnique({ where: { id }, select: { id: true } });

    if (!existe) {
      throw new ReservaNaoEncontradaError();
    }
  }

  private paraResponse(reserva: Reservation): ReservaResponse {
    const { id, plate, sectorId, expectedAt, status, createdAt, checkedInAt, checkedOutAt, cancelledAt } =
      reserva;

    return { id, plate, sectorId, expectedAt, status, createdAt, checkedInAt, checkedOutAt, cancelledAt };
  }
}
