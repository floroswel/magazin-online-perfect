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
    const { message, history, sessionId, userId } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ reply: "Vă rog să scrieți un mesaj." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load chatbot settings
    const { data: settingsRow } = await supabase.from("chatbot_settings").select("*").limit(1).maybeSingle();
    const settings = settingsRow || { enabled: true, features_enabled: {}, escalate_keywords: "", welcome_message: "" };

    if (!settings.enabled) {
      return new Response(JSON.stringify({ reply: settings.offline_message || "Chatbot-ul este momentan dezactivat." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load FAQ for context
    const { data: faqData } = await supabase.from("chatbot_faq").select("question, answer").eq("active", true);
    const faqContext = faqData?.length
      ? "\n\nFAQ (folosește aceste răspunsuri ca sursă de adevăr):\n" + faqData.map(f => `Î: ${f.question}\nR: ${f.answer}`).join("\n\n")
      : "";

    // Check for escalation keywords
    const keywords = (settings.escalate_keywords || "").split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean);
    const lowerMsg = message.toLowerCase();
    const shouldEscalate = keywords.some((kw: string) => lowerMsg.includes(kw));

    if (shouldEscalate) {
      // Log escalation
      if (sessionId) {
        await supabase.from("chatbot_sessions").update({ status: "escalated" }).eq("id", sessionId);
      }
      return new Response(JSON.stringify({
        reply: "Înțeleg preocuparea ta. Voi transfera conversația către un coleg din echipa de suport care te va putea ajuta mai bine. Vei fi contactat în cel mai scurt timp.",
        escalated: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lovableKey) {
      return new Response(JSON.stringify({ reply: "Mulțumesc pentru mesaj! Un operator va reveni în curând." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const features = settings.features_enabled || {};

    // Build system prompt
    const systemPrompt = `Ești un asistent virtual al magazinului online numit "${settings.assistant_name || "Asistent"}". Răspunzi în limba română, politicos și concis.
Ajuți clienții cu:
${features.order_tracking ? "- Informații despre statusul comenzilor" : ""}
${features.order_cancel ? "- Anulare comenzi (doar dacă nu au fost expediate)" : ""}
${features.return_init ? "- Inițiere cereri de retur" : ""}
${features.invoice_download ? "- Informații despre facturi" : ""}
${features.product_recommendations ? "- Recomandări de produse, prețuri, disponibilitate" : ""}
${features.faq ? "- Răspunsuri la întrebări frecvente" : ""}
- Politici de retur și garanție
- Livrare și plată

REGULI IMPORTANTE:
- Răspunde maxim 2-3 propoziții per răspuns.
- Dacă clientul întreabă despre o comandă, cere-i numărul comenzii și emailul.
- Dacă nu știi răspunsul, recomandă clientului să contacteze echipa de suport.
- Nu inventa informații despre produse sau comenzi.
- Poți folosi emoji-uri moderat (1-2 per mesaj).
${faqContext}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-10),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ reply: "Sistemul este momentan ocupat. Te rog încearcă din nou în câteva secunde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ reply: "Mulțumesc! Echipa noastră va reveni cu un răspuns." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI API error:", status);
      return new Response(JSON.stringify({ reply: "Mulțumesc! Echipa noastră va reveni cu un răspuns." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Mulțumesc pentru mesaj!";

    // Update session message count
    if (sessionId) {
      await supabase.rpc("", {}).catch(() => {});
      // Simple increment
      const { data: sess } = await supabase.from("chatbot_sessions").select("messages_count").eq("id", sessionId).maybeSingle();
      if (sess) {
        await supabase.from("chatbot_sessions").update({ messages_count: (sess.messages_count || 0) + 2 }).eq("id", sessionId);
      }
    }

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
