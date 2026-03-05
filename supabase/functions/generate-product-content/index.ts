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

    const { name, brand, category, specs, key_features, target_audience, tone, language } = await req.json();
    if (!name) throw new Error("Product name is required");

    const lang = language === "en" ? "English" : "Romanian";
    const toneMap: Record<string, string> = {
      professional: "profesional, autoritar, expert",
      friendly: "prietenos, accesibil, conversațional",
      persuasive: "persuasiv, orientat spre vânzare, cu urgență",
      minimal: "minimalist, concis, doar esențialul",
    };
    const audienceMap: Record<string, string> = {
      general: "publicul general",
      men: "bărbați",
      women: "femei",
      children: "copii și părinți",
      professionals: "profesioniști și specialiști",
      seniors: "seniori",
    };

    const toneText = toneMap[tone || "professional"] || toneMap.professional;
    const audienceText = audienceMap[target_audience || "general"] || audienceMap.general;

    const specsText = specs && Object.keys(specs).length > 0
      ? Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "";

    const prompt = `Generate product content for an e-commerce product listing.

Product: ${name}
${brand ? `Brand: ${brand}` : ""}
${category ? `Category: ${category}` : ""}
${specsText ? `Technical specs: ${specsText}` : ""}
${key_features ? `Key features: ${key_features}` : ""}
Target audience: ${audienceText}
Tone: ${toneText}
Language: ${lang}

Generate ALL of the following content pieces in ${lang}:
1. Full description (150-300 words, with HTML formatting including <ul><li> bullet points for key features, <p> paragraphs. Make it compelling and sales-oriented.)
2. Short description (1-2 sentences, max 160 characters, for product cards)
3. SEO meta title (max 60 characters, includes product name + key benefit)
4. SEO meta description (max 160 characters, includes a call to action)
5. Product tags (5-8 relevant tags for categorization)

Important: Do NOT invent specifications not provided. Use the tone specified. Focus on benefits, not just features.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are an expert e-commerce copywriter. Always respond using the provided tool.` },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_product_content",
              description: "Return all generated product content pieces",
              parameters: {
                type: "object",
                properties: {
                  description: { type: "string", description: "Full HTML description with paragraphs and bullet points, 150-300 words" },
                  short_description: { type: "string", description: "1-2 sentence summary, max 160 characters" },
                  meta_title: { type: "string", description: "SEO title, max 60 characters" },
                  meta_description: { type: "string", description: "SEO description with CTA, max 160 characters" },
                  tags: { type: "array", items: { type: "string" }, description: "5-8 relevant product tags" },
                },
                required: ["description", "short_description", "meta_title", "meta_description", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_product_content" } },
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      // Fallback: try to parse from content
      const content = data.choices?.[0]?.message?.content || "";
      throw new Error("No structured response from AI: " + content.slice(0, 200));
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
