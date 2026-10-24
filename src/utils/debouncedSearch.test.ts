import test from "node:test";
import assert from "node:assert/strict";
import { createDebouncedSearch } from "./debouncedSearch.ts";

const esperar = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

test("agrupa varias búsquedas seguidas y solo ejecuta la última", async () => {
  const ejecutadas: string[] = [];
  const resultados: string[] = [];

  const buscador = createDebouncedSearch<string>({
    delayMs: 1,
    run: async (query) => {
      ejecutadas.push(query);
      return `r:${query}`;
    },
    onResult: (data) => resultados.push(data),
  });

  buscador.search("a");
  buscador.search("ab");
  buscador.search("abc");
  await esperar();

  assert.deepEqual(ejecutadas, ["abc"]);
  assert.deepEqual(resultados, ["r:abc"]);
});

test("aborta la petición anterior cuando llega una búsqueda nueva", async () => {
  let signalA: AbortSignal | undefined;
  const senales: AbortSignal[] = [];

  const buscador = createDebouncedSearch<string>({
    delayMs: 0,
    run: (query, signal) => {
      senales.push(signal);
      if (query === "a") {
        signalA = signal;
        return new Promise(() => {}); // nunca resuelve
      }
      return Promise.resolve("r:ab");
    },
    onResult: () => {},
  });

  buscador.search("a");
  await esperar(5);
  assert.equal(signalA?.aborted, false);

  buscador.search("ab");
  assert.equal(signalA?.aborted, true);

  await esperar(5);
  assert.equal(senales.length, 2);
});

test("ignora la respuesta vieja aunque la petición ignore el abort", async () => {
  const resultados: string[] = [];
  let resolverA: ((valor: string) => void) | undefined;

  const buscador = createDebouncedSearch<string>({
    delayMs: 0,
    run: (query) => {
      if (query === "a") {
        return new Promise((resolve) => {
          resolverA = resolve;
        });
      }
      return Promise.resolve("r:ab");
    },
    onResult: (data) => resultados.push(data),
  });

  buscador.search("a");
  await esperar(5);
  buscador.search("ab");
  await esperar(5);

  resolverA?.("r:a");
  await esperar(5);

  assert.deepEqual(resultados, ["r:ab"]);
});

test("cancel detiene la búsqueda pendiente", async () => {
  let llamadas = 0;

  const buscador = createDebouncedSearch<string>({
    delayMs: 5,
    run: async () => {
      llamadas++;
      return "x";
    },
    onResult: () => {},
  });

  buscador.search("a");
  buscador.cancel();
  await esperar(20);

  assert.equal(llamadas, 0);
});

test("reporta el error solo de la búsqueda vigente", async () => {
  const errores: unknown[] = [];

  const buscador = createDebouncedSearch<string>({
    delayMs: 0,
    run: (query) => {
      if (query === "a") {
        return new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error("viejo")), 20);
        });
      }
      return Promise.reject(new Error("nuevo"));
    },
    onResult: () => {},
    onError: (error) => errores.push(error),
  });

  buscador.search("a");
  await esperar(5);
  buscador.search("b");
  await esperar(30);

  assert.equal(errores.length, 1);
  assert.equal((errores[0] as Error).message, "nuevo");
});

test("no reporta como error una petición abortada", async () => {
  const errores: unknown[] = [];

  const buscador = createDebouncedSearch<string>({
    delayMs: 0,
    run: (_query, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("abortada", "AbortError"));
        });
      }),
    onResult: () => {},
    onError: (error) => errores.push(error),
  });

  buscador.search("a");
  await esperar(5);
  buscador.search("b"); // aborta "a"; "b" queda en vuelo
  await esperar(5);

  assert.deepEqual(errores, []);
});
