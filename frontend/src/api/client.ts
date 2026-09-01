const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Erro já desembrulhado do formato `{ error: { code, message } }` do backend.
 * A tela ramifica por `code` e exibe `message` — nunca compara texto (AGENTS.md §8).
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

interface ErrorEnvelope {
  error?: { code?: unknown; message?: unknown };
}

function extrairErro(corpo: unknown, status: number): ApiError {
  const envelope = corpo as ErrorEnvelope | null;
  const code = envelope?.error?.code;
  const message = envelope?.error?.message;

  return new ApiError(
    typeof code === 'string' ? code : 'ERRO_DESCONHECIDO',
    typeof message === 'string' ? message : 'Não foi possível concluir a operação.',
    status,
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let resposta: Response;

  try {
    resposta = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('SEM_CONEXAO', 'Não foi possível falar com o servidor.', 0);
  }

  const corpo: unknown = resposta.status === 204 ? null : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw extrairErro(corpo, resposta.status);
  }

  return corpo as T;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string): Promise<T> => request<T>(path, { method: 'PATCH' }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
};
