import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do setor é obrigatório.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'A localização do setor é obrigatória.' })
  location!: string;

  @Type(() => Number)
  @IsInt({ message: 'A cota de vagas deve ser um número inteiro.' })
  @Min(1, { message: 'A cota de vagas deve ser no mínimo 1.' })
  quota!: number;

  // Em centavos: tarifa de R$ 5,50 chega como 550 (AGENTS.md §8).
  @Type(() => Number)
  @IsInt({ message: 'A tarifa por hora deve ser um número inteiro em centavos.' })
  @Min(0, { message: 'A tarifa por hora não pode ser negativa.' })
  hourlyRate!: number;
}
