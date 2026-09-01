import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { listarHistorico, type EventoHistorico } from '../api/history';
import { descreverEventoHistorico } from '../lib/history';

const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

export function HistoricoPage() {
  const [reservationId, setReservationId] = useState('');
  const [eventos, setEventos] = useState<EventoHistorico[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const id = reservationId.trim();

    if (id === '') {
      setErro('Informe o ID da reserva.');
      setEventos(null);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      setEventos(await listarHistorico(id));
    } catch (falha) {
      setEventos(null);
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível carregar o histórico.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="pagina">
      <h1>Histórico da reserva</h1>

      <form className="cartao" onSubmit={buscar} noValidate>
        <h2>Buscar reserva</h2>

        <div className="campos">
          <label>
            ID da reserva
            <input
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              placeholder="cole aqui o ID da reserva"
            />
          </label>
        </div>

        {erro !== null && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" disabled={carregando}>
          {carregando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {eventos !== null && (
        <div className="cartao">
          <h2>Eventos</h2>

          {eventos.length === 0 && <p className="vazio">Nenhum evento registrado para esta reserva.</p>}

          {eventos.length > 0 && (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>O que aconteceu</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((item) => (
                  <tr key={item.id}>
                    <td>{FORMATADOR_DATA_HORA.format(new Date(item.occurredAt))}</td>
                    <td>{descreverEventoHistorico(item.type, item.detail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
