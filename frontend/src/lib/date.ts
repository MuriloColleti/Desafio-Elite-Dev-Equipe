const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Recebe ISO em UTC e formata em pt-BR (AGENTS.md §4.3). */
export function formatarDataHora(iso: string): string {
  return FORMATADOR_DATA_HORA.format(new Date(iso));
}
