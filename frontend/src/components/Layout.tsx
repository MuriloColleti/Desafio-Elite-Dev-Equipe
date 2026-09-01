import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LINKS_POR_PERFIL, type Perfil } from '../lib/profile';

const PERFIS: { valor: Perfil; label: string }[] = [
  { valor: 'ADMINISTRADOR', label: 'Administrador' },
  { valor: 'MOTORISTA', label: 'Motorista' },
];

export function Layout() {
  const [perfil, setPerfil] = useState<Perfil>('ADMINISTRADOR');

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar__marca">Estacionamento Rotativo</span>

        <nav className="topbar__nav">
          {LINKS_POR_PERFIL[perfil].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'navlink navlink--ativo' : 'navlink')}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <label className="topbar__perfil">
          Perfil
          <select value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)}>
            {PERFIS.map(({ valor, label }) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
