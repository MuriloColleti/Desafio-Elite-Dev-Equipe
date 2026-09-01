import { Module } from '@nestjs/common';
import { HistoryModule } from './history/history.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SectorsModule } from './sectors/sectors.module';
import { WaitlistModule } from './waitlist/waitlist.module';

// Cada story registra o próprio módulo aqui ao entrar (AGENTS.md §3).
@Module({
  imports: [PrismaModule, HistoryModule, SectorsModule, ReservationsModule, WaitlistModule],
})
export class AppModule {}
