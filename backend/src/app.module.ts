import { Module } from '@nestjs/common';
import { HistoryModule } from './history/history.module';
import { PrismaModule } from './prisma/prisma.module';
import { SectorsModule } from './sectors/sectors.module';

// Cada story registra o próprio módulo aqui ao entrar (AGENTS.md §3).
@Module({
  imports: [PrismaModule, HistoryModule, SectorsModule],
})
export class AppModule {}
