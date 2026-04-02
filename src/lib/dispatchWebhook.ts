import { supabase } from "@/integrations/supabase/client";

export async function dispatchWebhook(eventType: string, payload: Record<string, unknown>) {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const session = (await supabase.auth.getSession()).data.session;

    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/dispatch-webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ event_type: eventType, payload }),
      }
    );

    if (!res.ok) {
      console.warn(`[dispatchWebhook] ${eventType} failed:`, res.status);
    }
  } catch (err) {
    console.warn(`[dispatchWebhook] ${eventType} error:`, err);
  }
}
