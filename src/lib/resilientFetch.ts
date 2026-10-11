/**
 * iOS drops idle keep-alive connections, and the first request after a quiet
 * spell then fails with "The network connection was lost" even though the
 * network is fine; the next tap works. This wraps fetch so that:
 *  - a request that follows a quiet spell is preceded by a cheap GET that
 *    re-opens the connection (its result is ignored), and
 *  - read-only requests are retried once if they still fail to connect.
 * Writes are never retried automatically, so a record can't be saved twice.
 */
export interface ResilientFetchOptions {
  baseFetch?: typeof fetch;
  /** Cheap, side-effect-free URL used to re-open the connection. */
  warmUpUrl: string;
  warmUpHeaders?: Record<string, string>;
  /** Treat the connection as stale after this much time without traffic. */
  idleMs?: number;
  now?: () => number;
}

export function createResilientFetch(options: ResilientFetchOptions): typeof fetch {
  const { warmUpUrl, warmUpHeaders, idleMs = 20_000 } = options;
  const baseFetch = options.baseFetch ?? fetch;
  const now = options.now ?? Date.now;
  let lastTrafficAt = now();

  return async (input, init) => {
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    const isReadOnly = method === 'GET' || method === 'HEAD';

    if (now() - lastTrafficAt > idleMs) {
      try {
        await baseFetch(warmUpUrl, { method: 'GET', headers: warmUpHeaders });
      } catch {
        // The warm-up exists to absorb exactly this failure.
      }
      lastTrafficAt = now();
    }

    try {
      const response = await baseFetch(input, init);
      lastTrafficAt = now();
      return response;
    } catch (error) {
      if (!isReadOnly) throw error;
      const response = await baseFetch(input, init);
      lastTrafficAt = now();
      return response;
    }
  };
}
