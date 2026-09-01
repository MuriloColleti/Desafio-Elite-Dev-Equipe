import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TxClient } from '../common/transaction';
import { ReservationsService } from '../reservations/reservations.service';

export interface PromocaoResultado {
  reservationId: string;
  plate: string;
}

@Injectable()
export class WaitlistService {
  constructor(
    @Inject(forwardRef(() => ReservationsService))
    private readonly reservations: ReservationsService,
  ) {}

  /**
   * Promove o primeiro da fila do setor para reserva ativa, dentro da mesma
   * transação do cancelamento que abriu a vaga (AGENTS.md §4 e §4.1).
   *
   * Stub da ESTC-2: quem entregar a ESTC-4 preenche o corpo aqui — sem tocar
   * em `reservations` — buscando o menor `position` da fila do setor e, se
   * achar, chamando `this.reservations.criarComTx(...)` com a MESMA `tx`
   * (AGENTS.md §4.3), depois removendo a entrada da fila. Não achando
   * ninguém, retorna `null` e a cota sobe sozinha por ser derivada.
   */
  async promoverProximo(sectorId: string, tx: TxClient): Promise<PromocaoResultado | null> {
    return null;
  }
}
