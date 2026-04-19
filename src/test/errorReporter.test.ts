import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
const fromMock = vi.fn((_table: string) => ({ insert: insertMock }));
const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => fromMock(...args),
    auth: { getUser: () => getUserMock() },
  },
}));

import { captureError } from "@/lib/errorReporter";

describe("captureError", () => {
  beforeEach(() => {
    insertMock.mockClear();
    fromMock.mockClear();
    // Force sample
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  it("logs an Error to error_log with fingerprint", async () => {
    await captureError(new Error("Boom"), { extra: { route: "/x" } }, "error");
    expect(fromMock).toHaveBeenCalledWith("error_log");
    const arg = insertMock.mock.calls[0][0];
    expect(arg.message).toBe("Boom");
    expect(arg.level).toBe("error");
    expect(arg.fingerprint).toContain("Boom");
    expect(arg.context_json.route).toBe("/x");
    expect(arg.user_id).toBe("test-user-id");
  });

  it("accepts string error", async () => {
    await captureError("Plain message", {}, "warn");
    const arg = insertMock.mock.calls[0][0];
    expect(arg.message).toBe("Plain message");
    expect(arg.level).toBe("warn");
  });

  it("never throws even if DB call fails", async () => {
    insertMock.mockRejectedValueOnce(new Error("DB down"));
    await expect(captureError(new Error("X"))).resolves.toBeUndefined();
  });

  it("samples warn at lower rate", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    await captureError("dropped", {}, "warn");
    expect(insertMock).not.toHaveBeenCalled();
  });
});
