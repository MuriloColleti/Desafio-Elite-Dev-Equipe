import { Global, Module } from '@nestjs/common';
import { HistoryService } from './history.service';

// Global: as quatro outras stories gravam evento e nenhuma deve precisar
// importar este módulo para isso (AGENTS.md §4).
// A rota GET do histórico é da ESTC-5 e entra junto com o controller dela.
@Global()
@Module({
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
