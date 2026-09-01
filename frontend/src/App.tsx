import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EsperaPage } from './pages/EsperaPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { RankingPage } from './pages/RankingPage';
import { ReservasPage } from './pages/ReservasPage';
import { SetoresPage } from './pages/SetoresPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/setores" replace />} />
        <Route path="/setores" element={<SetoresPage />} />
        <Route path="/reservas" element={<ReservasPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/espera" element={<EsperaPage />} />
        <Route path="/historico" element={<HistoricoPage />} />
        <Route path="*" element={<Navigate to="/setores" replace />} />
      </Route>
    </Routes>
  );
}
