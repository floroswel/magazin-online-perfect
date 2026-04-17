const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cui } = await req.json();
    if (!cui) {
      return new Response(JSON.stringify({ error: "CUI lipsă" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCui = String(cui).replace(/^RO/i, "").replace(/[^0-9]/g, "").trim();
    if (!cleanCui || cleanCui.length < 2 || cleanCui.length > 10) {
      return new Response(JSON.stringify({ error: "CUI invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    // ANAF v8 API - with 10s timeout + 1 retry
    let data: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          "https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ cui: parseInt(cleanCui), data: today }]),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!response.ok) {
          if (attempt === 0) continue;
          return new Response(
            JSON.stringify({ error: "ANAF temporar indisponibil. Completează manual datele." }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        data = await response.json();
        break;
      } catch (err: any) {
        if (attempt === 1) {
          return new Response(
            JSON.stringify({ error: "ANAF temporar indisponibil. Completează manual datele." }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const found = data?.found?.[0];
    if (!found) {
      return new Response(
        JSON.stringify({ error: "CUI negăsit în baza de date ANAF" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse ANAF v8 response structure
    const dg = found.date_generale || {};
    const adresaFull = dg.adresa || found.adresa || "";
    const denumire = dg.denumire || found.denumire || "";
    const nrRegCom = dg.nrRegCom || found.nrRegCom || "";
    const codPostal = dg.codPostal || found.cod_postal || "";

    // Extract judet from address (ANAF format: "..., JUD. TELEORMAN")
    let judet = "";
    const judetMatch = adresaFull.match(/,\s*(?:JUD\.?\s*)([A-ZĂÂÎȘȚăâîșț\s-]+)\s*$/i);
    if (judetMatch) {
      judet = judetMatch[1].trim();
    }

    // Extract locality
    let localitate = "";
    const locMatch = adresaFull.match(/(?:MUN\.?\s*|OR\.?\s*|COM\.?\s*|SAT\s+)([A-ZĂÂÎȘȚăâîșț\s-]+)/i);
    if (locMatch) {
      localitate = locMatch[1].trim();
    }

    const platitorTva = found.inregistrare_scop_Tva?.scpTVA === true ||
                        found.scpTVA === true || false;

    return new Response(
      JSON.stringify({
        success: true,
        denumire,
        cui: cleanCui,
        nrRegCom,
        platitorTva,
        adresa: adresaFull,
        judet,
        localitate,
        codPostal,
        stare: dg.stare_inregistrare || found.stare || "ACTIVA",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Eroare server: " + (err.message || "necunoscută") }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
