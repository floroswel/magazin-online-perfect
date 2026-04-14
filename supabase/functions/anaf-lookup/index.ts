import { corsHeaders } from "@supabase/supabase-js/cors";

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

    const cleanCui = String(cui).replace(/^RO/i, "").replace(/\s/g, "").trim();
    if (!cleanCui || cleanCui.length < 2 || isNaN(Number(cleanCui))) {
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

    // Parse address into components
    const adresaFull = found.date_generale?.adresa || found.adresa || "";
    const denumire = found.date_generale?.denumire || found.denumire || "";
    const nrRegCom = found.date_generale?.nrRegCom || found.nrRegCom || "";
    const codPostal = found.date_generale?.codPostal || found.cod_postal || "";
    const judet = found.date_generale?.adresa_judet || found.judet || "";
    const localitate = found.date_generale?.adresa_localitate || found.localitate || "";
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
        stare: found.date_generale?.stare_inregistrare || found.stare || "ACTIVA",
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
