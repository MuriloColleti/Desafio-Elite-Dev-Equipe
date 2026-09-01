import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateSectorDto } from './dto/create-sector.dto';
import { SectorsService, SetorComCota } from './sectors.service';

@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectors: SectorsService) {}

  @Post()
  criar(@Body() dto: CreateSectorDto): Promise<SetorComCota> {
    return this.sectors.criar(dto);
  }

  @Get()
  listar(): Promise<SetorComCota[]> {
    return this.sectors.listar();
  }

  @Get(':id')
  buscar(@Param('id') id: string): Promise<SetorComCota> {
    return this.sectors.buscarPorId(id);
  }
}
