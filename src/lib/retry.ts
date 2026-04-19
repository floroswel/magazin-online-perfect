/**
 * Retry/backoff helper for query + edge function calls.
 *
 * Defaults match enterprise standards:
 *   - 3 attempts, exponential backoff 200ms → 800ms → 1600ms (+jitter ±20%)
 *   - 10s per-attempt timeout
 *   - Retry only on network/5xx; never on 4xx (client errors)
 */

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  retryOn?: (err: unknown) => boolean;
  onRetry?: (attempt: number, err: unknown) => void;
}

const DEFAULT_OPTS: Required<Omit<RetryOptions, "onRetry" | "retryOn">> = {
  attempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 4000,
  timeoutMs: 10_000,
};

function defaultRetryOn(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as Error)?.message ?? String(err);
  // Network / abort / timeout / 5xx
  if (/NetworkError|Failed to fetch|timeout|ECONN|ETIMEDOUT|fetch failed/i.test(msg)) return true;
  const status = (err as any)?.status ?? (err as any)?.code;
  if (typeof status === "number" && status >= 500 && status < 600) return true;
  return false;
}

function jitter(ms: number) {
  return ms * (0.8 + Math.random() * 0.4);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); })
     .catch((e) => { clearTimeout(t); reject(e); });
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const o = { ...DEFAULT_OPTS, ...opts };
  const retryOn = opts.retryOn ?? defaultRetryOn;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= o.attempts; attempt++) {
    try {
      return await withTimeout(fn(), o.timeoutMs);
    } catch (err) {
      lastErr = err;
      if (attempt === o.attempts || !retryOn(err)) throw err;
      const delay = Math.min(o.maxDelayMs, jitter(o.baseDelayMs * Math.pow(2, attempt - 1)));
      opts.onRetry?.(attempt, err);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Wraps a Supabase functions.invoke with retry + timeout. */
export async function invokeWithRetry<T = unknown>(
  invoke: () => Promise<{ data: T | null; error: any }>,
  opts: RetryOptions = {},
): Promise<{ data: T | null; error: any }> {
  return withRetry(async () => {
    const res = await invoke();
    if (res.error && defaultRetryOn(res.error)) throw res.error;
    return res;
  }, opts);
}
