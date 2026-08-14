const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4100";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

const RETRYABLE_NETWORK_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reintenta solo cuando `fetch` mismo falla (sin internet, DNS, conexión
// rechazada) — nunca cuando el servidor sí respondió, aunque sea con un
// error. Reintentar una respuesta de error real (4xx/5xx) no tiene sentido
// (el servidor ya decidió), y reintentar un POST que sí llegó al servidor
// arriesgaría duplicar la escritura (ej. un intento contado dos veces) —
// eso requeriría claves de idempotencia en el servidor, fuera de este
// alcance. Esto solo cubre la falla de red más común: la request nunca salió.
async function fetchWithRetry(input: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRYABLE_NETWORK_ATTEMPTS; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt < RETRYABLE_NETWORK_ATTEMPTS) {
        await wait(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchWithRetry(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // manda/recibe la cookie de sesión httpOnly
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
};
