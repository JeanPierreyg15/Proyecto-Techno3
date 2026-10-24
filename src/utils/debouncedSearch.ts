export type SearchRunner<T> = (
  query: string,
  signal: AbortSignal,
) => Promise<T>;

export interface DebouncedSearchOptions<T> {
  run: SearchRunner<T>;
  onResult: (data: T) => void;
  onError?: (error: unknown) => void;
  delayMs?: number;
}

export interface DebouncedSearch {
  search(query: string): void;
  cancel(): void;
}

export function createDebouncedSearch<T>({
  run,
  onResult,
  onError,
  delayMs = 300,
}: DebouncedSearchOptions<T>): DebouncedSearch {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let version = 0;

  const cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }

    controller?.abort();
    controller = undefined;
    version++;
  };

  const search = (query: string) => {
    cancel();

    const currentVersion = version;

    timer = setTimeout(async () => {
      timer = undefined;

      const current = new AbortController();
      controller = current;

      try {
        const data = await run(query, current.signal);

        if (currentVersion === version && !current.signal.aborted) {
          onResult(data);
        }
      } catch (error) {
        if (currentVersion === version && !current.signal.aborted) {
          onError?.(error);
        }
      }
    }, delayMs);
  };

  return { search, cancel };
}
