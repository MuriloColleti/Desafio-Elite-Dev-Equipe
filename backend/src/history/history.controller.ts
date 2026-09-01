import { Controller, Get, Param } from '@nestjs/common';
import { EventoHistorico, HistoryService } from './history.service';

@Controller('reservations')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get(':id/history')
  listar(@Param('id') id: string): Promise<EventoHistorico[]> {
    return this.history.listarPorReserva(id);
  }
}
