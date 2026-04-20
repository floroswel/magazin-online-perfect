import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up judet id from abbreviation
    const { data: judet, error: jErr } = await supabase
      .from("romania_judete")
      .select("id, abreviere, nume")
      .ilike("abreviere", judetAuto)
      .maybeSingle();

    if (jErr) throw jErr;
    if (!judet) {
      return new Response(
        JSON.stringify({ error: "Județ inexistent", localities: [] }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch ALL localities for this judet (no 1000 default cap)
    const { data, error } = await supabase
      .from("romania_localitati")
      .select("id, nume, tip")
      .eq("judet_id", judet.id)
      .order("nume", { ascending: true })
      .range(0, 9999);

    if (error) throw error;

    const tipOrder: Record<string, number> = {
      municipiu: 0,
      "municipiu reședință": 0,
      oraș: 1,
      oras: 1,
      comună: 2,
      comuna: 2,
      sat: 3,
      localitate: 4,
    };

    const localities = (data || [])
      .map((l: any) => ({
        id: l.id,
        nume: l.nume,
        tip: l.tip || "localitate",
      }))
      .sort((a: any, b: any) => {
        const da = tipOrder[a.tip] ?? 5;
        const db = tipOrder[b.tip] ?? 5;
        if (da !== db) return da - db;
        return a.nume.localeCompare(b.nume, "ro");
      });

    return new Response(
      JSON.stringify({ localities, judet: judet.nume, total: localities.length }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  } catch (err) {
    console.error("get-localities error:", err);
    return new Response(
      JSON.stringify({ error: "Eroare la obținerea localităților" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
