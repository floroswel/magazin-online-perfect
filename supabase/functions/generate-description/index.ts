import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { name, brand, category, specs } = await req.json();
    if (!name) throw new Error("Product name is required");

    const specsText = specs && Object.keys(specs).length > 0
      ? Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "";

    const prompt = `Generează o descriere comercială unică și convingătoare în limba română pentru produsul următor dintr-un magazin online de electronice/electrocasnice/IT.

Produs: ${name}
${brand ? `Brand: ${brand}` : ""}
${category ? `Categorie: ${category}` : ""}
${specsText ? `Specificații tehnice: ${specsText}` : ""}

Cerințe:
- Descrierea trebuie să fie între 150-300 de cuvinte
- Ton profesional dar accesibil, orientat spre vânzare
- Evidențiază beneficiile principale, nu doar caracteristicile
- Include un paragraf introductiv captivant
- Structurează cu paragrafe scurte
- NU folosi markdown, doar text simplu cu rânduri noi
- NU inventa specificații care nu au fost furnizate
- Folosește limba română corectă, fără anglicisme inutile`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Ești un copywriter expert pentru magazine online din România, specializat în electronice, electrocasnice și IT." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limita de cereri AI depășită. Încearcă din nou în câteva secunde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credit AI insuficient." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-description error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
