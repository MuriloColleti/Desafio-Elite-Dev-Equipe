import { Module } from '@nestjs/common';
import { HistoryModule } from './history/history.module';
import { PrismaModule } from './prisma/prisma.module';
import { SectorsModule } from './sectors/sectors.module';
import { RankingModule } from './ranking/ranking.module';

// Cada story registra o próprio módulo aqui ao entrar (AGENTS.md §3).
@Module({
  imports: [PrismaModule, HistoryModule, SectorsModule, RankingModule],
})
export class AppModule {}
