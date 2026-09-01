import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty({ message: 'A placa é obrigatória.' })
  plate!: string;

  @IsString()
  @IsNotEmpty({ message: 'O setor é obrigatório.' })
  sectorId!: string;

  // O front converte com toISOString() antes de enviar (AGENTS.md §4.3).
  @Type(() => Date)
  @IsDate({ message: 'A data/hora prevista de chegada é inválida.' })
  expectedAt!: Date;
}
