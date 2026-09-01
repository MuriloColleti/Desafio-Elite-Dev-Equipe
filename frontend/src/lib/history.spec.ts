import { describe, expect, it } from 'vitest';
import { descreverEventoHistorico } from './history';

describe('descreverEventoHistorico', () => {
  it('descreve a criação da reserva', () => {
    expect(descreverEventoHistorico('CREATED', null)).toBe('Reserva criada.');
  });

  it('descreve o cancelamento da reserva', () => {
    expect(descreverEventoHistorico('CANCELLED', null)).toBe('Reserva cancelada.');
  });

  it('descreve o check-in', () => {
    expect(descreverEventoHistorico('CHECKED_IN', null)).toBe('Check-in realizado.');
  });

  it('descreve o check-out', () => {
    expect(descreverEventoHistorico('CHECKED_OUT', null)).toBe('Check-out realizado.');
  });

  it('descreve a entrada na lista de espera', () => {
    expect(descreverEventoHistorico('WAITLIST_JOINED', null)).toBe('Entrou na lista de espera.');
  });

  it('descreve a saída voluntária da lista de espera', () => {
    expect(descreverEventoHistorico('WAITLIST_LEFT', null)).toBe(
      'Saiu da lista de espera por vontade própria.',
    );
  });

  it('descreve a promoção da lista de espera indicando qual cancelamento a originou', () => {
    const texto = descreverEventoHistorico('WAITLIST_PROMOTED', 'reserva-999');

    expect(texto).toContain('reserva-999');
    expect(texto).toContain('Promovido da lista de espera');
  });
});
