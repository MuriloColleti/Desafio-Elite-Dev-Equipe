import { forwardRef, Module } from '@nestjs/common';
import { SectorsModule } from '../sectors/sectors.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [SectorsModule, forwardRef(() => WaitlistModule)],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
