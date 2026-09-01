import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import {
  cancelarReserva,
  criarReserva,
  fazerCheckIn,
  fazerCheckOut,
  listarReservasPorPlaca,
  type NovaReserva,
  type Reserva,
  type ReservationStatus,
} from '../api/reservations';
import { listarSetores, type Setor } from '../api/sectors';
import { formatarDataHora } from '../lib/date';

interface Formulario {
  plate: string;
  sectorId: string;
  expectedAt: string;
}

const FORMULARIO_VAZIO: Formulario = { plate: '', sectorId: '', expectedAt: '' };

const STATUS_LABEL: Record<ReservationStatus, string> = {
  AGENDADO: 'Agendado',
  EM_USO: 'Em uso',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

function validar(campos: Formulario): { erro: string } | { dados: NovaReserva } {
  if (campos.plate.trim() === '') {
    return { erro: 'Informe a placa.' };
  }

  if (campos.sectorId === '') {
    return { erro: 'Selecione o setor.' };
  }

  if (campos.expectedAt === '') {
    return { erro: 'Informe a data e hora previstas de chegada.' };
  }

  const expectedAt = new Date(campos.expectedAt);

  if (Number.isNaN(expectedAt.getTime()) || expectedAt.getTime() <= Date.now()) {
    return { erro: 'A data/hora prevista de chegada deve ser no futuro.' };
  }

  return {
    dados: {
      plate: campos.plate.trim(),
      sectorId: campos.sectorId,
      expectedAt: expectedAt.toISOString(),
    },
  };
}

export function ReservasPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [campos, setCampos] = useState<Formulario>(FORMULARIO_VAZIO);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [placaBusca, setPlacaBusca] = useState('');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroConsulta, setErroConsulta] = useState<string | null>(null);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<string | null>(null);

  useEffect(() => {
    listarSetores()
      .then(setSetores)
      .catch(() => setSetores([]));
  }, []);

  const nomeSetor = useCallback(
    (sectorId: string) => setores.find((s) => s.id === sectorId)?.name ?? sectorId,
    [setores],
  );

  const buscar = useCallback(async (plate: string) => {
    if (plate.trim() === '') {
      setReservas([]);
      setBuscou(false);
      return;
    }

    setCarregando(true);
    try {
      setReservas(await listarReservasPorPlaca(plate.trim()));
      setErroConsulta(null);
    } catch (erro) {
      setErroConsulta(erro instanceof ApiError ? erro.message : 'Não foi possível consultar as reservas.');
    } finally {
      setCarregando(false);
      setBuscou(true);
    }
  }, []);

  function alterar(campo: keyof Formulario, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const resultado = validar(campos);

    if ('erro' in resultado) {
      setErroFormulario(resultado.erro);
      return;
    }

    setErroFormulario(null);
    setSalvando(true);

    try {
      await criarReserva(resultado.dados);
      setCampos(FORMULARIO_VAZIO);
      setPlacaBusca(resultado.dados.plate);
      await buscar(resultado.dados.plate);
    } catch (erro) {
      setErroFormulario(erro instanceof ApiError ? erro.message : 'Não foi possível reservar a vaga.');
    } finally {
      setSalvando(false);
    }
  }

  async function executarAcao(id: string, acao: (id: string) => Promise<Reserva>) {
    setAcaoEmAndamento(id);
    try {
      await acao(id);
      await buscar(placaBusca);
      setErroConsulta(null);
    } catch (erro) {
      setErroConsulta(erro instanceof ApiError ? erro.message : 'Não foi possível concluir a ação.');
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  return (
    <section className="pagina">
      <h1>Reservas</h1>

      <form className="cartao" onSubmit={enviar} noValidate>
        <h2>Reservar vaga</h2>

        <div className="campos">
          <label>
            Placa
            <input
              value={campos.plate}
              onChange={(e) => alterar('plate', e.target.value)}
              placeholder="ABC1D23"
            />
          </label>

          <label>
            Setor
            <select value={campos.sectorId} onChange={(e) => alterar('sectorId', e.target.value)}>
              <option value="">Selecione…</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.name} — {setor.availableQuota} vaga(s) livre(s)
                </option>
              ))}
            </select>
          </label>

          <label>
            Chegada prevista
            <input
              type="datetime-local"
              value={campos.expectedAt}
              onChange={(e) => alterar('expectedAt', e.target.value)}
            />
          </label>
        </div>

        {erroFormulario !== null && (
          <p className="erro" role="alert">
            {erroFormulario}
          </p>
        )}

        <button type="submit" disabled={salvando}>
          {salvando ? 'Reservando…' : 'Reservar vaga'}
        </button>
      </form>

      <div className="cartao">
        <h2>Consultar por placa</h2>

        <div className="campos campos--busca">
          <label>
            Placa
            <input
              value={placaBusca}
              onChange={(e) => setPlacaBusca(e.target.value)}
              placeholder="ABC1D23"
            />
          </label>
          <button type="button" onClick={() => buscar(placaBusca)} disabled={carregando}>
            {carregando ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {erroConsulta !== null && (
          <p className="erro" role="alert">
            {erroConsulta}
          </p>
        )}

        {!carregando && buscou && erroConsulta === null && reservas.length === 0 && (
          <p className="vazio">Nenhuma reserva encontrada para essa placa.</p>
        )}

        {reservas.length > 0 && (
          <table className="tabela">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Setor</th>
                <th>Chegada prevista</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((reserva) => (
                <tr key={reserva.id}>
                  <td>{reserva.plate}</td>
                  <td>{nomeSetor(reserva.sectorId)}</td>
                  <td>{formatarDataHora(reserva.expectedAt)}</td>
                  <td>
                    <span className={`status status--${reserva.status.toLowerCase()}`}>
                      {STATUS_LABEL[reserva.status]}
                    </span>
                  </td>
                  <td className="tabela__acoes">
                    {reserva.status === 'AGENDADO' && (
                      <button
                        type="button"
                        onClick={() => executarAcao(reserva.id, fazerCheckIn)}
                        disabled={acaoEmAndamento === reserva.id}
                      >
                        Check-in
                      </button>
                    )}
                    {reserva.status === 'EM_USO' && (
                      <button
                        type="button"
                        onClick={() => executarAcao(reserva.id, fazerCheckOut)}
                        disabled={acaoEmAndamento === reserva.id}
                      >
                        Check-out
                      </button>
                    )}
                    {(reserva.status === 'AGENDADO' || reserva.status === 'EM_USO') && (
                      <button
                        type="button"
                        className="botao--secundario"
                        onClick={() => executarAcao(reserva.id, cancelarReserva)}
                        disabled={acaoEmAndamento === reserva.id}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
