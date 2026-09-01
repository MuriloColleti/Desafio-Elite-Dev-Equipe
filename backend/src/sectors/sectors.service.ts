import { Injectable } from '@nestjs/common';
import { SetorNaoEncontradoError } from '../common/errors';
import { ocupaVaga } from '../common/reservation-status';
import { TxClient } from '../common/transaction';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';

export interface SetorComCota {
  id: string;
  name: string;
  location: string;
  quota: number;
  hourlyRate: number;
  availableQuota: number;
  createdAt: Date;
}

@Injectable()
export class SectorsService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateSectorDto): Promise<SetorComCota> {
    const setor = await this.prisma.sector.create({
      data: {
        name: dto.name.trim(),
        location: dto.location.trim(),
        quota: dto.quota,
        hourlyRate: dto.hourlyRate,
      },
    });

    // Setor recém-criado não tem reserva, então a cota disponível é a total.
    return { ...setor, availableQuota: setor.quota };
  }

  async listar(): Promise<SetorComCota[]> {
    const setores = await this.prisma.sector.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { reservations: { where: ocupaVaga() } },
        },
      },
    });

    return setores.map(({ _count, ...setor }) => ({
      ...setor,
      availableQuota: setor.quota - _count.reservations,
    }));
  }

  async buscarPorId(id: string): Promise<SetorComCota> {
    const setor = await this.prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reservations: { where: ocupaVaga() } },
        },
      },
    });

    if (!setor) {
      throw new SetorNaoEncontradoError();
    }

    const { _count, ...dados } = setor;
    return { ...dados, availableQuota: dados.quota - _count.reservations };
  }

  /**
   * Cota disponível do setor: total menos as reservas ativas (AGENTS.md §7).
   * Nunca é lida de coluna — contador armazenado é a origem clássica de
   * vender a mesma vaga duas vezes.
   *
   * Recebe `tx` porque ESTC-2 e ESTC-4 precisam checar a cota dentro da mesma
   * transação em que criam a reserva.
   */
  async obterCotaDisponivel(sectorId: string, tx: TxClient): Promise<number> {
    const setor = await tx.sector.findUnique({
      where: { id: sectorId },
      select: { quota: true },
    });

    if (!setor) {
      throw new SetorNaoEncontradoError();
    }

    const ativas = await tx.reservation.count({
      where: { sectorId, ...ocupaVaga() },
    });

    return setor.quota - ativas;
  }
}
