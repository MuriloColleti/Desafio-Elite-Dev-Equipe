import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { listarSetores, type Setor } from '../api/sectors';
import {
  entrarNaEspera,
  listarEspera,
  sairDaEspera,
  type EntradaEspera,
  type NovaEntradaEspera,
} from '../api/waitlist';
import { formatarDataHora } from '../lib/date';

interface Formulario {
  plate: string;
  expectedAt: string;
}

const FORMULARIO_VAZIO: Formulario = { plate: '', expectedAt: '' };

function validar(campos: Formulario): { erro: string } | { dados: NovaEntradaEspera } {
  if (campos.plate.trim() === '') {
    return { erro: 'Informe a placa.' };
  }

  if (campos.expectedAt === '') {
    return { erro: 'Informe a data e hora previstas de chegada.' };
  }

  const expectedAt = new Date(campos.expectedAt);

  if (Number.isNaN(expectedAt.getTime()) || expectedAt.getTime() <= Date.now()) {
    return { erro: 'A data/hora prevista de chegada deve ser no futuro.' };
  }

  return {
    dados: { plate: campos.plate.trim(), expectedAt: expectedAt.toISOString() },
  };
}

export function EsperaPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [setorId, setSetorId] = useState('');
  const [fila, setFila] = useState<EntradaEspera[]>([]);

  const [campos, setCampos] = useState<Formulario>(FORMULARIO_VAZIO);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [erroFila, setErroFila] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [saindo, setSaindo] = useState<string | null>(null);

  const setorSelecionado = setores.find((setor) => setor.id === setorId);

  const carregarSetores = useCallback(async () => {
    try {
      const lista = await listarSetores();
      setSetores(lista);
      setSetorId((atual) => atual || (lista[0]?.id ?? ''));
    } catch (erro) {
      setErroFila(
        erro instanceof ApiError ? erro.message : 'Não foi possível carregar os setores.',
      );
    }
  }, []);

  const carregarFila = useCallback(async (id: string) => {
    if (!id) {
      setFila([]);
      return;
    }

    setCarregando(true);

    try {
      setFila(await listarEspera(id));
      setErroFila(null);
    } catch (erro) {
      setErroFila(
        erro instanceof ApiError ? erro.message : 'Não foi possível carregar a lista de espera.',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarSetores();
  }, [carregarSetores]);

  useEffect(() => {
    void carregarFila(setorId);
  }, [setorId, carregarFila]);

  // Entrar e sair mudam a fila e podem mudar a cota (a promoção consome uma
  // vaga), então as duas listas são recarregadas juntas.
  async function recarregar() {
    await Promise.all([carregarSetores(), carregarFila(setorId)]);
  }

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const resultado = validar(campos);

    if ('erro' in resultado) {
      setErroFormulario(resultado.erro);
      return;
    }

    setErroFormulario(null);
    setSalvando(true);

    try {
      await entrarNaEspera(setorId, resultado.dados);
      setCampos(FORMULARIO_VAZIO);
      await recarregar();
    } catch (erro) {
      setErroFormulario(
        erro instanceof ApiError ? erro.message : 'Não foi possível entrar na lista de espera.',
      );
    } finally {
      setSalvando(false);
    }
  }

  async function sair(id: string) {
    setSaindo(id);
    setErroFila(null);

    try {
      await sairDaEspera(id);
      await recarregar();
    } catch (erro) {
      setErroFila(
        erro instanceof ApiError ? erro.message : 'Não foi possível sair da lista de espera.',
      );
    } finally {
      setSaindo(null);
    }
  }

  const semCota = setorSelecionado !== undefined && setorSelecionado.availableQuota <= 0;

  return (
    <section className="pagina">
      <h1>Lista de espera</h1>

      <div className="cartao">
        <h2>Setor</h2>

        <div className="campos">
          <label>
            Escolha o setor
            <select value={setorId} onChange={(e) => setSetorId(e.target.value)}>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.name} — {setor.availableQuota} de {setor.quota} vagas livres
                </option>
              ))}
            </select>
          </label>
        </div>

        {setorSelecionado !== undefined && (
          <p className={semCota ? 'aviso-cota aviso-cota--esgotada' : 'aviso-cota'}>
            {semCota
              ? 'Este setor está sem cota disponível. Entre na lista de espera para ser contemplado se alguém cancelar.'
              : `Ainda há ${setorSelecionado.availableQuota} vaga(s) livre(s) neste setor — é possível reservar direto, sem esperar.`}
          </p>
        )}
      </div>

      <form className="cartao" onSubmit={entrar} noValidate>
        <h2>Entrar na lista</h2>

        <div className="campos">
          <label>
            Placa
            <input
              value={campos.plate}
              onChange={(e) => setCampos((atual) => ({ ...atual, plate: e.target.value }))}
              placeholder="ABC1D23"
            />
          </label>

          <label>
            Chegada prevista
            <input
              type="datetime-local"
              value={campos.expectedAt}
              onChange={(e) => setCampos((atual) => ({ ...atual, expectedAt: e.target.value }))}
            />
          </label>
        </div>

        {erroFormulario !== null && (
          <p className="erro" role="alert">
            {erroFormulario}
          </p>
        )}

        <button type="submit" disabled={salvando || setorId === ''}>
          {salvando ? 'Entrando…' : 'Entrar na lista de espera'}
        </button>
      </form>

      <div className="cartao">
        <h2>Fila do setor</h2>

        {erroFila !== null && (
          <p className="erro" role="alert">
            {erroFila}
          </p>
        )}

        {carregando && <p className="vazio">Carregando…</p>}

        {!carregando && erroFila === null && fila.length === 0 && (
          <p className="vazio">Nenhuma placa na lista de espera deste setor.</p>
        )}

        {fila.length > 0 && (
          <table className="tabela">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Placa</th>
                <th>Chegada prevista</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fila.map((entrada, indice) => (
                <tr key={entrada.id}>
                  {/* A ordem exibida é a posição na fila, não o `position` do
                      banco: ele não é renumerado na saída (AGENTS.md §4.1) e
                      mostraria buracos como 1, 3, 7. */}
                  <td>{indice + 1}º</td>
                  <td>{entrada.plate}</td>
                  <td>{formatarDataHora(entrada.expectedAt)}</td>
                  <td className="tabela__acoes">
                    <button
                      type="button"
                      className="botao--secundario"
                      onClick={() => sair(entrada.id)}
                      disabled={saindo === entrada.id}
                    >
                      Sair da lista
                    </button>
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
