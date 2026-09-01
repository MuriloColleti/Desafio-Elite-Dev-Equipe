import { Global, Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

// Global: as quatro outras stories gravam evento e nenhuma deve precisar
// importar este módulo para isso (AGENTS.md §4).
@Global()
@Module({
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
