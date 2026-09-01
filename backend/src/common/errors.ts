export type AppErrorCode =
  | 'VALIDACAO'
  | 'SETOR_NAO_ENCONTRADO'
  | 'SETOR_SEM_COTA'
  | 'RESERVA_NAO_ENCONTRADA'
  | 'PLACA_JA_TEM_RESERVA'
  | 'PLACA_JA_NA_LISTA'
  | 'DATA_NO_PASSADO'
  | 'ESPERA_NAO_ENCONTRADA'
  | 'TRANSICAO_INVALIDA';

export abstract class AppError extends Error {
  abstract readonly code: AppErrorCode;
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidacaoError extends AppError {
  readonly code = 'VALIDACAO' as const;
  readonly status = 400;
}

export class SetorNaoEncontradoError extends AppError {
  readonly code = 'SETOR_NAO_ENCONTRADO' as const;
  readonly status = 404;

  constructor() {
    super('Setor não encontrado.');
  }
}

export class SetorSemCotaError extends AppError {
  readonly code = 'SETOR_SEM_COTA' as const;
  readonly status = 409;

  constructor() {
    super('Este setor está sem cota disponível. Você pode entrar na lista de espera.');
  }
}

export class ReservaNaoEncontradaError extends AppError {
  readonly code = 'RESERVA_NAO_ENCONTRADA' as const;
  readonly status = 404;

  constructor() {
    super('Reserva não encontrada.');
  }
}

export class PlacaJaTemReservaError extends AppError {
  readonly code = 'PLACA_JA_TEM_RESERVA' as const;
  readonly status = 409;

  constructor() {
    super('Esta placa já possui uma reserva ativa. Cancele a reserva atual antes de criar outra.');
  }
}

export class PlacaJaNaListaError extends AppError {
  readonly code = 'PLACA_JA_NA_LISTA' as const;
  readonly status = 409;

  constructor() {
    super('Esta placa já está na lista de espera deste setor.');
  }
}

export class DataNoPassadoError extends AppError {
  readonly code = 'DATA_NO_PASSADO' as const;
  readonly status = 400;

  constructor() {
    super('A data/hora prevista de chegada deve ser no futuro.');
  }
}

export class EsperaNaoEncontradaError extends AppError {
  readonly code = 'ESPERA_NAO_ENCONTRADA' as const;
  readonly status = 404;

  constructor() {
    super('Entrada na lista de espera não encontrada.');
  }
}

/**
 * Transição de estado que o ciclo de vida não permite: check-in em reserva que
 * não está AGENDADO, check-out em reserva que não está EM_USO, ou cancelar o
 * que já terminou. Ver AGENTS.md §4.1.
 */
export class TransicaoInvalidaError extends AppError {
  readonly code = 'TRANSICAO_INVALIDA' as const;
  readonly status = 409;

  constructor(mensagem: string) {
    super(mensagem);
  }
}
