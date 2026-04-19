import { describe, it, expect, vi } from "vitest";
import { withRetry, invokeWithRetry } from "@/lib/retry";

describe("withRetry", () => {
  it("returns immediately on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const r = await withRetry(fn);
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on network error and eventually succeeds", async () => {
    let calls = 0;
    const fn = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new Error("Failed to fetch");
      return "recovered";
    });
    const r = await withRetry(fn, { baseDelayMs: 1, attempts: 5 });
    expect(r).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry on 4xx client errors", async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error("Bad Request"), { status: 400 }));
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toThrow("Bad Request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx server errors", async () => {
    let calls = 0;
    const fn = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 2) throw Object.assign(new Error("Server"), { status: 503 });
      return "ok";
    });
    const r = await withRetry(fn, { baseDelayMs: 1 });
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("times out a hung promise", async () => {
    const fn = () => new Promise((_) => { /* never resolves */ });
    await expect(withRetry(fn, { baseDelayMs: 1, timeoutMs: 50, attempts: 1 }))
      .rejects.toThrow(/timed out/i);
  });

  it("respects max attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    await expect(withRetry(fn, { baseDelayMs: 1, attempts: 2 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("calls onRetry callback per failed attempt", async () => {
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    await expect(withRetry(fn, { baseDelayMs: 1, attempts: 3, onRetry })).rejects.toThrow();
    expect(onRetry).toHaveBeenCalledTimes(2); // attempt 1 + 2 fail, no callback for final
  });
});

describe("invokeWithRetry", () => {
  it("treats supabase {error} as throw and retries", async () => {
    let calls = 0;
    const invoke = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 2) return { data: null, error: { message: "Failed to fetch", status: 500 } };
      return { data: { ok: true }, error: null };
    });
    const r = await invokeWithRetry<any>(invoke, { baseDelayMs: 1 });
    expect(r.data).toEqual({ ok: true });
    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
