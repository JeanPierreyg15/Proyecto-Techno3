import { getApiUrl } from "../../../config";

/**
 * Fetch pensado para el build (SSG).
 *
 * El sitio es estático y en cada build se generan cientos de páginas. Si cada
 * página vuelve a pedir los mismos endpoints (contacto, redes, horario, etc.)
 * la API responde 429 (Too Many Requests) y el build termina roto.
 *
 * Este helper:
 *  - cachea cada URL durante todo el build (una sola petición por endpoint),
 *  - deduplica peticiones concurrentes,
 *  - reintenta automáticamente ante 429 / 5xx respetando `Retry-After`.
 */
const cache = new Map<string, Promise<unknown>>();

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 600;
const MAX_DELAY_MS = 15000;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const resolveUrl = (input: string): string =>
  /^https?:\/\//i.test(input) ? input : getApiUrl(input);

const retryDelay = (attempt: number, response?: Response): number => {
  const retryAfter = Number(response?.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, MAX_DELAY_MS);
  }
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
};

async function requestWithRetry(url: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) return response;

      // Errores transitorios: límite de peticiones y fallos del servidor.
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < MAX_RETRIES) {
          await sleep(retryDelay(attempt, response));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(retryDelay(attempt));
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Devuelve el JSON del endpoint (ya desenvuelve `{ data: ... }`).
 * Devuelve `null` si la petición falla, para que el build pueda decidir
 * cómo continuar sin romperse.
 */
export function fetchBuildJson<T>(input: string): Promise<T | null> {
  const url = resolveUrl(input);
  const cached = cache.get(url);
  if (cached) return cached as Promise<T | null>;

  const promise = (async () => {
    try {
      const response = await requestWithRetry(url);
      if (!response.ok) {
        console.error("FETCH FALLÓ:", url, response.status);
        return null;
      }
      const json = await response.json();
      return (json?.data ?? json) as T;
    } catch (error) {
      console.error("FETCH ERROR:", url, error);
      return null;
    }
  })();

  // También cacheamos los fallos: si un endpoint está caído (por ejemplo,
  // `/configuracion/*` devolviendo 500), no queremos que cada una de las
  // cientos de páginas repita la misma ronda de reintentos y el build tarde
  // minutos u horas. El build sigue adelante con los datos disponibles.
  cache.set(url, promise);

  return promise;
}
