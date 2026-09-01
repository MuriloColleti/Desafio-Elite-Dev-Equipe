import { useEffect, useState } from 'react';
import { getRanking, type RankingItem } from '../api/ranking';

export function RankingPage() {
  const [itens, setItens] = useState<RankingItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getRanking()
      .then(setItens)
      .catch(() => setErro('Não foi possível carregar o ranking.'))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return null;

  return (
    <div className="pagina">
      <h1>Setores mais reservados</h1>

      {erro && <p className="erro">{erro}</p>}

      {!erro && itens.length === 0 && (
        <div className="aviso">
          <p>Nenhuma reserva registrada ainda.</p>
        </div>
      )}

      {!erro && itens.length > 0 && (
        <div className="cartao">
          <table className="tabela">
            <thead>
              <tr>
                <th>Setor</th>
                <th>Total de reservas</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.totalReservations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}