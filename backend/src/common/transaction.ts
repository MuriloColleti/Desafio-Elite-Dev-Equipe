import { Prisma } from '@prisma/client';

/**
 * Cliente válido tanto dentro de `prisma.$transaction` quanto fora dele.
 * Reservar, cancelar e promover da fila precisam correr na MESMA transação
 * (AGENTS.md §9), então todo service que participa desses fluxos recebe isto.
 */
export type TxClient = Prisma.TransactionClient;
