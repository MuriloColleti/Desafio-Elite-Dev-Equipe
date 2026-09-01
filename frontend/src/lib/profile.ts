export type Perfil = 'ADMINISTRADOR' | 'MOTORISTA';

export interface LinkDeNavegacao {
  to: string;
  label: string;
}

/**
 * Seletor de perfil é só demo, sem senha e sem autenticação: nenhuma regra do
 * backend depende dele (AGENTS.md §10). Serve para mostrar os dois papéis.
 */
export const LINKS_POR_PERFIL: Record<Perfil, LinkDeNavegacao[]> = {
  ADMINISTRADOR: [
    { to: '/setores', label: 'Setores' },
    { to: '/ranking', label: 'Ranking' },
    { to: '/historico', label: 'Histórico' },
  ],
  MOTORISTA: [
    { to: '/reservas', label: 'Reservas' },
    { to: '/espera', label: 'Espera' },
  ],
};
