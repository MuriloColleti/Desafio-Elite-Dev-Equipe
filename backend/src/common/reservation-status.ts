import { Prisma, ReservationStatus } from '@prisma/client';

/**
 * Estados em que a reserva ocupa uma vaga do setor.
 *
 * `EM_USO` conta porque o carro está fisicamente no pátio: liberar a vaga no
 * check-in venderia o mesmo lugar duas vezes. Só o check-out (`CONCLUIDO`) e o
 * cancelamento devolvem a vaga.
 *
 * Toda contagem de cota disponível filtra por aqui — não repita a lista.
 */
export function statusQueOcupamVaga(): ReservationStatus[] {
  return [ReservationStatus.AGENDADO, ReservationStatus.EM_USO];
}

export function ocupaVaga(): Prisma.ReservationWhereInput {
  return { status: { in: statusQueOcupamVaga() } };
}
