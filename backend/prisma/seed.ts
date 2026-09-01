import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const SETORES: Prisma.SectorCreateInput[] = [
  { name: 'Setor A - Coberto', location: 'Térreo, próximo à entrada principal', quota: 20, hourlyRate: 850 },
  { name: 'Setor B - Descoberto', location: 'Pátio lateral, ao lado da rampa', quota: 35, hourlyRate: 550 },
  { name: 'Setor C - Rotativo Rápido', location: 'Subsolo 1, vagas 101 a 115', quota: 15, hourlyRate: 1200 },
];

async function main(): Promise<void> {
  for (const setor of SETORES) {
    // `name` não é único no schema (congelado na fase 0), então a idempotência
    // é por busca prévia em vez de upsert.
    const existente = await prisma.sector.findFirst({ where: { name: setor.name } });

    if (existente) {
      console.info(`Setor já existe, mantido: ${setor.name}`);
      continue;
    }

    const criado = await prisma.sector.create({ data: setor });
    console.info(`Setor criado: ${criado.name} (${criado.id})`);
  }
}

main()
  .catch((erro: unknown) => {
    console.error('Falha ao semear os setores:', erro);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
