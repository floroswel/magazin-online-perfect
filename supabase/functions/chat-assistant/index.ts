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
    const { message, history } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ reply: "Vă rog să scrieți un mesaj." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ reply: "Mulțumesc pentru mesaj! Un operator va reveni în curând." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [
      {
        role: "system",
        content: `Ești un asistent virtual al magazinului online. Răspunzi în limba română, politicos și concis. 
Ajuți clienții cu:
- Informații despre produse, prețuri, disponibilitate
- Statusul comenzilor 
- Politici de retur și garanție
- Livrare și plată
- Recomandări de produse
Dacă nu știi răspunsul, recomandă clientului să contacteze echipa de suport la email sau telefon.
Răspunde maxim 2-3 propoziții.`,
      },
      ...(history || []).slice(-10),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return new Response(JSON.stringify({ reply: "Mulțumesc! Echipa noastră va reveni cu un răspuns." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Mulțumesc pentru mesaj!";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ reply: "Ne cerem scuze, a apărut o eroare. Vă rugăm să încercați din nou." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
