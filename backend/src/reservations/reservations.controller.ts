import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservaResponse, ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post()
  criar(@Body() dto: CreateReservationDto): Promise<ReservaResponse> {
    return this.reservations.criar(dto);
  }

  @Get()
  listar(
    @Query('plate') plate?: string,
    @Query('sectorId') sectorId?: string,
  ): Promise<ReservaResponse[]> {
    return this.reservations.listar(plate, sectorId);
  }

  @Get(':id')
  buscar(@Param('id') id: string): Promise<ReservaResponse> {
    return this.reservations.buscarPorId(id);
  }

  @Patch(':id/cancel')
  cancelar(@Param('id') id: string): Promise<ReservaResponse> {
    return this.reservations.cancelar(id);
  }

  @Patch(':id/check-in')
  checkIn(@Param('id') id: string): Promise<ReservaResponse> {
    return this.reservations.checkIn(id);
  }

  @Patch(':id/check-out')
  checkOut(@Param('id') id: string): Promise<ReservaResponse> {
    return this.reservations.checkOut(id);
  }
}
