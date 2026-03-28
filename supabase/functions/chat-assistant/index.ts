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

    if (!message || typeof message !== "string" || message.trim().length === 0) {
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
    const settings = settingsRow || { enabled: true, features_enabled: {}, escalate_keywords: "", welcome_message: "", assistant_name: "Asistent" };

    if (!settings.enabled) {
      return new Response(JSON.stringify({ reply: settings.offline_message || "Chatbot-ul este momentan dezactivat." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load FAQ for context
    const { data: faqData } = await supabase.from("chatbot_faq").select("question, answer").eq("active", true);
    const faqContext = faqData?.length
      ? "\n\nFAQ (folosește aceste răspunsuri ca sursă de adevăr):\n" + faqData.map((f: any) => `Î: ${f.question}\nR: ${f.answer}`).join("\n\n")
      : "";

    // Check for escalation keywords
    const keywords = (settings.escalate_keywords || "").split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean);
    const lowerMsg = message.toLowerCase();
    const shouldEscalate = keywords.some((kw: string) => lowerMsg.includes(kw));

    if (shouldEscalate) {
      if (sessionId) {
        await supabase.from("chatbot_sessions").update({ status: "escalated" }).eq("id", sessionId);
      }
      return new Response(JSON.stringify({
        reply: "Înțeleg preocuparea ta. Voi transfera conversația către un coleg din echipa de suport care te va putea ajuta mai bine. Vei fi contactat în cel mai scurt timp. 🤝",
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

    // --- Real-time order lookup ---
    let orderContext = "";
    // Detect order number pattern (e.g. MAN-xxx, #xxxx, 8+ hex chars)
    const orderNumMatch = message.match(/(?:comanda|order|#)\s*([A-Za-z0-9-]{6,})/i)
      || message.match(/\b(MAN-[A-Za-z0-9]+)\b/i)
      || message.match(/\b([0-9a-fA-F]{8})\b/);

    if (orderNumMatch && features.order_tracking) {
      const searchTerm = orderNumMatch[1];
      // Search by order_number or id prefix
      const { data: foundOrders } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, shipping_status, payment_status, tracking_number, courier, payment_method, shipping_address")
        .or(`order_number.ilike.%${searchTerm}%,id.ilike.${searchTerm}%`)
        .limit(3);

      if (foundOrders && foundOrders.length > 0) {
        const statusLabels: Record<string, string> = {
          pending: "În așteptare",
          processing: "În procesare",
          confirmed: "Confirmată",
          shipped: "Expediată",
          delivered: "Livrată",
          cancelled: "Anulată",
        };
        orderContext = "\n\nINFORMAȚII COMENZI GĂSITE (date reale din sistem - comunică-le clientului):\n";
        for (const o of foundOrders) {
          const addr = o.shipping_address as any;
          orderContext += `- Comandă: ${o.order_number || o.id.slice(0, 8)}
  Status: ${statusLabels[o.status] || o.status}
  Total: ${o.total} RON
  Plată: ${o.payment_method || "N/A"} (${o.payment_status || "N/A"})
  Livrare: ${o.shipping_status || "N/A"}${o.tracking_number ? ` | AWB: ${o.tracking_number}` : ""}${o.courier ? ` | Curier: ${o.courier}` : ""}
  Data: ${o.created_at ? new Date(o.created_at).toLocaleDateString("ro-RO") : "N/A"}
  Destinatar: ${addr?.fullName || "N/A"}, ${addr?.city || ""}\n`;
        }
      }
    }

    // --- Product lookup ---
    let productContext = "";
    if (features.product_recommendations) {
      // Check if user asks about a product
      const prodKeywords = ["produs", "pret", "preț", "disponibil", "stoc", "lumanare", "lumânare", "parfum", "cadou"];
      const asksAboutProduct = prodKeywords.some(kw => lowerMsg.includes(kw));
      if (asksAboutProduct && lowerMsg.length > 10) {
        // Try to find relevant products
        const searchWords = message.replace(/[^\w\sșțăîâ]/gi, "").trim();
        if (searchWords.length >= 3) {
          const { data: products } = await supabase
            .from("products")
            .select("name, price, old_price, stock, slug, sku")
            .or(`name.ilike.%${searchWords.split(/\s+/).slice(0, 3).join("%")}%`)
            .eq("status", "active")
            .limit(5);

          if (products && products.length > 0) {
            productContext = "\n\nPRODUSE RELEVANTE DIN CATALOG (date reale):\n";
            for (const p of products) {
              productContext += `- ${p.name} | ${p.price} RON${p.old_price ? ` (redus de la ${p.old_price} RON)` : ""} | Stoc: ${p.stock ?? "N/A"} | Link: /produs/${p.slug}\n`;
            }
          }
        }
      }
    }

    // Build system prompt
    const systemPrompt = `Ești un asistent virtual profesionist al magazinului online, numele tău este "${settings.assistant_name || "Asistent"}". Răspunzi EXCLUSIV în limba română, politicos, prietenos și concis.

CAPACITĂȚILE TALE:
${features.order_tracking ? "✅ Poți căuta și afișa statusul comenzilor când clientul oferă un număr de comandă." : ""}
${features.order_cancel ? "✅ Poți ghida clientul în procesul de anulare a unei comenzi (doar dacă nu a fost expediată)." : ""}
${features.return_init ? "✅ Poți ghida clientul să inițieze un retur." : ""}
${features.invoice_download ? "✅ Poți oferi informații despre facturi." : ""}
${features.product_recommendations ? "✅ Poți recomanda produse și oferi informații despre prețuri/disponibilitate." : ""}
${features.faq ? "✅ Poți răspunde la întrebări frecvente din baza de cunoștințe." : ""}
- Informații despre politicile magazinului (retur, garanție, livrare, plată)

REGULI STRICTE:
1. Răspunde maxim 3-4 propoziții per răspuns, clar și la obiect.
2. Dacă clientul întreabă despre o comandă, cere-i **numărul comenzii** dacă nu l-a furnizat deja.
3. Dacă ai date reale din sistem (comenzi/produse), prezintă-le clar cu formatare.
4. NU inventa informații — dacă nu ai date, spune sincer și recomandă contactarea suportului.
5. Folosește emoji-uri moderat (max 2 per mesaj) pentru a fi prietenos.
6. Pentru retururi, informează că pot fi inițiate din contul clientului secțiunea "Retururi".
7. Livrare: standard 1-3 zile lucrătoare, gratuită peste 150 RON.
8. Metode de plată: card, ramburs, transfer bancar, rate prin Mokka.
${faqContext}${orderContext}${productContext}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-12),
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
        messages: aiMessages,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ reply: "Sistemul este momentan ocupat. Te rog încearcă din nou în câteva secunde. ⏳" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ reply: "Mulțumesc pentru mesaj! Te rog contactează-ne la suport pentru asistență. 📧" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI API error:", status, await response.text());
      return new Response(JSON.stringify({ reply: "Mulțumesc! Echipa noastră va reveni cu un răspuns." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Mulțumesc pentru mesaj! 😊";

    // Update session message count
    if (sessionId) {
      try {
        const { data: sess } = await supabase.from("chatbot_sessions").select("messages_count").eq("id", sessionId).maybeSingle();
        if (sess) {
          await supabase.from("chatbot_sessions").update({ messages_count: (sess.messages_count || 0) + 2 }).eq("id", sessionId);
        }
      } catch (e) {
        console.error("Session update error:", e);
      }
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ reply: "Ne cerem scuze, a apărut o eroare. Vă rugăm să încercați din nou. 🙏" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
