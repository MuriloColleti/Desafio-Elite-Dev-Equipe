import { forwardRef, Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { WaitlistService } from './waitlist.service';

// forwardRef porque reservations.cancelar() chama promoverProximo() e, na
// outra ponta, a ESTC-4 chama reservations.criarComTx() (AGENTS.md §4.3) —
// os dois módulos dependem um do outro.
@Module({
  imports: [forwardRef(() => ReservationsModule)],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
