import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import { listarHistorico, type EventoHistorico } from '../api/history';
import type { Reserva } from '../api/reservations';
import { descreverEventoHistorico } from '../lib/history';

const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

interface HistoricoDaReserva {
  reserva: Reserva;
  eventos: EventoHistorico[];
}

export function HistoricoPage() {
  const [historicos, setHistoricos] = useState<HistoricoDaReserva[]>([]);
  const [filtroId, setFiltroId] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const reservas = await api.get<Reserva[]>('/reservations');
      const lista = await Promise.all(
        reservas.map(async (reserva) => ({
          reserva,
          eventos: await listarHistorico(reserva.id),
        })),
      );
      setHistoricos(lista);
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível carregar o histórico.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const historicosFiltrados = useMemo(() => {
    const id = filtroId.trim();
    return id === ''
      ? historicos
      : historicos.filter((item) => item.reserva.id.includes(id));
  }, [historicos, filtroId]);

  return (
    <section className="pagina">
      <h1>Histórico das reservas</h1>

      <div className="cartao">
        <h2>Filtrar por ID (opcional)</h2>

        <div className="campos">
          <label>
            ID da reserva
            <input
              value={filtroId}
              onChange={(e) => setFiltroId(e.target.value)}
              placeholder="deixe em branco para ver todas"
            />
          </label>
        </div>
      </div>

      {erro !== null && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {carregando && <p className="vazio">Carregando…</p>}

      {!carregando && erro === null && historicosFiltrados.length === 0 && (
        <p className="vazio">Nenhuma reserva encontrada.</p>
      )}

      {!carregando &&
        historicosFiltrados.map(({ reserva, eventos }) => (
          <div className="cartao" key={reserva.id}>
            <h2>
              Placa {reserva.plate} — {reserva.id}
            </h2>

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
          </div>
        ))}
    </section>
  );
}
