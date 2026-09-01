import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { criarSetor, listarSetores, type NovoSetor, type Setor } from '../api/sectors';
import { formatarCentavos, reaisParaCentavos } from '../lib/money';

interface Formulario {
  name: string;
  location: string;
  quota: string;
  hourlyRate: string;
}

const FORMULARIO_VAZIO: Formulario = { name: '', location: '', quota: '', hourlyRate: '' };

function validar(campos: Formulario): { erro: string } | { dados: NovoSetor } {
  if (campos.name.trim() === '') {
    return { erro: 'Informe o nome do setor.' };
  }

  if (campos.location.trim() === '') {
    return { erro: 'Informe a localização do setor.' };
  }

  const quota = Number(campos.quota);

  if (!Number.isInteger(quota) || quota < 1) {
    return { erro: 'A cota de vagas deve ser um número inteiro maior ou igual a 1.' };
  }

  const hourlyRate = reaisParaCentavos(campos.hourlyRate);

  if (hourlyRate === null) {
    return { erro: 'Informe a tarifa por hora em reais (ex.: 5,50).' };
  }

  if (hourlyRate < 0) {
    return { erro: 'A tarifa por hora não pode ser negativa.' };
  }

  return {
    dados: {
      name: campos.name.trim(),
      location: campos.location.trim(),
      quota,
      hourlyRate,
    },
  };
}

export function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [campos, setCampos] = useState<Formulario>(FORMULARIO_VAZIO);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setSetores(await listarSetores());
      setErroLista(null);
    } catch (erro) {
      setErroLista(erro instanceof ApiError ? erro.message : 'Não foi possível carregar os setores.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

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
      await criarSetor(resultado.dados);
      setCampos(FORMULARIO_VAZIO);
      await carregar();
    } catch (erro) {
      setErroFormulario(
        erro instanceof ApiError ? erro.message : 'Não foi possível cadastrar o setor.',
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="pagina">
      <h1>Setores</h1>

      <form className="cartao" onSubmit={enviar} noValidate>
        <h2>Cadastrar setor</h2>

        <div className="campos">
          <label>
            Nome
            <input
              value={campos.name}
              onChange={(e) => alterar('name', e.target.value)}
              placeholder="Setor A"
            />
          </label>

          <label>
            Localização
            <input
              value={campos.location}
              onChange={(e) => alterar('location', e.target.value)}
              placeholder="Térreo — ala norte"
            />
          </label>

          <label>
            Cota de vagas
            <input
              type="number"
              value={campos.quota}
              onChange={(e) => alterar('quota', e.target.value)}
              placeholder="20"
            />
          </label>

          <label>
            Tarifa por hora (R$)
            <input
              value={campos.hourlyRate}
              onChange={(e) => alterar('hourlyRate', e.target.value)}
              placeholder="5,50"
            />
          </label>
        </div>

        {erroFormulario !== null && (
          <p className="erro" role="alert">
            {erroFormulario}
          </p>
        )}

        <button type="submit" disabled={salvando}>
          {salvando ? 'Cadastrando…' : 'Cadastrar setor'}
        </button>
      </form>

      <div className="cartao">
        <h2>Setores cadastrados</h2>

        {erroLista !== null && (
          <p className="erro" role="alert">
            {erroLista}
          </p>
        )}

        {carregando && <p className="vazio">Carregando…</p>}

        {!carregando && erroLista === null && setores.length === 0 && (
          <p className="vazio">Nenhum setor cadastrado ainda.</p>
        )}

        {setores.length > 0 && (
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Localização</th>
                <th>Cota total</th>
                <th>Cota disponível</th>
                <th>Tarifa/hora</th>
              </tr>
            </thead>
            <tbody>
              {setores.map((setor) => (
                <tr key={setor.id}>
                  <td>{setor.name}</td>
                  <td>{setor.location}</td>
                  <td>{setor.quota}</td>
                  <td>{setor.availableQuota}</td>
                  <td>{formatarCentavos(setor.hourlyRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
