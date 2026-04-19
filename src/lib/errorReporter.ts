/**
 * ErrorReporter — unified error capture for production observability.
 *
 * Strategy: hybrid (DB-first with optional Sentry adapter).
 * - Always logs to public.error_log (RLS allows anon insert).
 * - If `window.Sentry` is present (loaded externally via custom script), forwards there.
 * - Adds release version + user context + fingerprint for dedup.
 *
 * Add Sentry later by injecting their snippet via Admin → Custom Scripts; no code change.
 */
import { supabase } from "@/integrations/supabase/client";

type Level = "fatal" | "error" | "warn" | "info";

const RELEASE = (import.meta as any).env?.VITE_APP_RELEASE || "unknown";
const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || "1.0.0";

const SAMPLE_RATES: Record<Level, number> = {
  fatal: 1,
  error: 1,
  warn: 0.3,
  info: 0.05,
};

function shouldSample(level: Level) {
  const rate = SAMPLE_RATES[level] ?? 1;
  return Math.random() < rate;
}

function fingerprintOf(message: string, stack?: string | null): string {
  const stackHead = (stack ?? "").split("\n").slice(0, 3).join("|");
  return `${message.slice(0, 80)}::${stackHead.slice(0, 120)}`;
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

interface CaptureContext {
  url?: string;
  componentStack?: string;
  extra?: Record<string, unknown>;
}

export async function captureError(
  error: Error | string,
  context: CaptureContext = {},
  level: Level = "error",
): Promise<void> {
  if (!shouldSample(level)) return;

  const message = typeof error === "string" ? error : error.message || "Unknown error";
  const stack = typeof error === "string" ? null : error.stack ?? null;
  const url = context.url ?? (typeof window !== "undefined" ? window.location.href : null);
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
  const userId = await getCurrentUserId();

  // 1) Forward to Sentry if loaded
  try {
    const w = window as any;
    if (w?.Sentry?.captureException && typeof error !== "string") {
      w.Sentry.captureException(error, {
        level,
        tags: { release: RELEASE, version: APP_VERSION },
        extra: context.extra,
        contexts: { component: { stack: context.componentStack } },
      });
    } else if (w?.Sentry?.captureMessage) {
      w.Sentry.captureMessage(message, level);
    }
  } catch {
    /* noop */
  }

  // 2) Always persist to DB
  try {
    await supabase.from("error_log").insert({
      level,
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 8000) ?? null,
      url,
      user_agent: userAgent?.slice(0, 500) ?? null,
      user_id: userId,
      release_version: `${APP_VERSION}@${RELEASE}`.slice(0, 100),
      fingerprint: fingerprintOf(message, stack),
      context_json: {
        componentStack: context.componentStack ?? null,
        ...(context.extra ?? {}),
      },
    });
  } catch (dbErr) {
    // Last-resort console only — never throw from error reporter
    // eslint-disable-next-line no-console
    console.error("[errorReporter] DB log failed:", dbErr);
  }
}

/** Install global handlers for unhandled errors + rejections. Call once at app boot. */
export function installGlobalHandlers(): void {
  if (typeof window === "undefined") return;
  if ((window as any).__errorReporterInstalled) return;
  (window as any).__errorReporterInstalled = true;

  window.addEventListener("error", (e) => {
    captureError(e.error ?? e.message ?? "window.onerror", {
      url: e.filename,
      extra: { lineno: e.lineno, colno: e.colno },
    }, "error");
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    captureError(
      reason instanceof Error ? reason : new Error(String(reason)),
      { extra: { type: "unhandledrejection" } },
      "error",
    );
  });
}
