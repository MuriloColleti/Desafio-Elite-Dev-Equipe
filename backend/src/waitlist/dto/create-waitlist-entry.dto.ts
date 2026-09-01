import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateWaitlistEntryDto {
@IsString()
@IsNotEmpty({ message: 'A placa é obrigatória.' })
plate!: string;

// O front converte com toISOString() antes de enviar.
@Type(() => Date)
@IsDate({ message: 'A data/hora prevista de chegada é inválida.' })
expectedAt!: Date;
}
