import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { judetAuto } = await req.json();

    if (!judetAuto || typeof judetAuto !== "string" || judetAuto.length > 3) {
      return new Response(
        JSON.stringify({ error: "Abreviere județ invalidă" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(
        `https://roloca.coldfuse.io/orase/${encodeURIComponent(judetAuto)}`,
        { signal: controller.signal }
      );
    } catch (e) {
      // Retry once
      response = await fetch(
        `https://roloca.coldfuse.io/orase/${encodeURIComponent(judetAuto)}`,
        { signal: AbortSignal.timeout(10000) }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Nu s-au putut încărca localitățile" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawData = await response.json();

    // Roloca returns array of objects with "nume" field
    const localities = (Array.isArray(rawData) ? rawData : [])
      .map((item: any) => ({
        id: item.id || 0,
        nume: item.nume || item.name || String(item),
        tip: item.simplesort === 1 ? "municipiu" : item.simplesort === 2 ? "oraș" : "sat",
      }))
      .sort((a: any, b: any) => {
        // Cities first, then alphabetical
        const tipOrder: Record<string, number> = { municipiu: 0, oraș: 1, sat: 2 };
        const diff = (tipOrder[a.tip] ?? 3) - (tipOrder[b.tip] ?? 3);
        if (diff !== 0) return diff;
        return a.nume.localeCompare(b.nume, "ro");
      });

    return new Response(
      JSON.stringify({ localities }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-localities error:", err);
    return new Response(
      JSON.stringify({ error: "Eroare la obținerea localităților" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
