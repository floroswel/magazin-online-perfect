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

    // Load FAQ
    const { data: faqData } = await supabase.from("chatbot_faq").select("question, answer").eq("active", true);
    const faqContext = faqData?.length
      ? "\n\nFAQ BAZĂ DE CUNOȘTINȚE:\n" + faqData.map((f: any) => `Î: ${f.question}\nR: ${f.answer}`).join("\n\n")
      : "";

    // Check escalation keywords
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

    // ─── Parallel data loading for store context ───
    const contextPromises: Promise<string>[] = [];

    // 1. Order lookup
    const orderNumMatch = message.match(/(?:comanda|order|#)\s*([A-Za-z0-9-]{4,})/i)
      || message.match(/\b(MAN-[A-Za-z0-9]+)\b/i)
      || message.match(/\b([0-9]{5,8})\b/)
      || message.match(/\b([0-9a-fA-F]{8})\b/);

    if (orderNumMatch && features.order_tracking) {
      contextPromises.push((async () => {
        const searchTerm = orderNumMatch[1];
        const { data: foundOrders } = await supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, shipping_status, payment_status, tracking_number, courier, payment_method, shipping_address, items")
          .or(`order_number.ilike.%${searchTerm}%,id.ilike.${searchTerm}%`)
          .limit(3);

        if (!foundOrders?.length) return "";
        
        const statusLabels: Record<string, string> = {
          pending: "⏳ În așteptare", processing: "🔄 În procesare", confirmed: "✅ Confirmată",
          shipped: "📦 Expediată", delivered: "✅ Livrată", cancelled: "❌ Anulată",
          returned: "↩️ Returnată", refunded: "💰 Rambursată",
        };
        let ctx = "\n\n📋 COMENZI GĂSITE ÎN SISTEM (date REALE, afișează-le clientului):\n";
        for (const o of foundOrders) {
          const addr = o.shipping_address as any;
          const itemsList = Array.isArray(o.items) ? (o.items as any[]).slice(0, 5).map((i: any) => `${i.name || i.product_name || "Produs"} x${i.quantity || 1}`).join(", ") : "";
          ctx += `─────────────────────
Comandă: #${o.order_number || o.id.slice(0, 8)}
Status: ${statusLabels[o.status] || o.status}
Total: ${o.total} RON | Plată: ${o.payment_method || "N/A"} (${o.payment_status || "N/A"})
Livrare: ${o.shipping_status || "în pregătire"}${o.tracking_number ? ` | AWB: ${o.tracking_number}` : ""}${o.courier ? ` | Curier: ${o.courier}` : ""}
Data: ${o.created_at ? new Date(o.created_at).toLocaleDateString("ro-RO") : "N/A"}
Destinatar: ${addr?.fullName || "N/A"}, ${addr?.city || ""}
${itemsList ? `Produse: ${itemsList}` : ""}
`;
        }
        return ctx;
      })());
    }

    // 2. User's recent orders (if logged in and asks about orders generally)
    if (userId && !orderNumMatch && (lowerMsg.includes("comand") || lowerMsg.includes("unde") || lowerMsg.includes("status"))) {
      contextPromises.push((async () => {
        const { data: userOrders } = await supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, shipping_status, tracking_number, courier")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!userOrders?.length) return "\n\n📋 Clientul nu are comenzi recente în cont.";
        
        const statusLabels: Record<string, string> = {
          pending: "⏳ Așteptare", processing: "🔄 Procesare", confirmed: "✅ Confirmată",
          shipped: "📦 Expediată", delivered: "✅ Livrată", cancelled: "❌ Anulată",
        };
        let ctx = "\n\n📋 COMENZILE RECENTE ALE CLIENTULUI:\n";
        for (const o of userOrders) {
          ctx += `- #${o.order_number || o.id.slice(0, 8)} | ${statusLabels[o.status] || o.status} | ${o.total} RON | ${new Date(o.created_at).toLocaleDateString("ro-RO")}${o.tracking_number ? ` | AWB: ${o.tracking_number}` : ""}\n`;
        }
        return ctx;
      })());
    }

    // 3. Product search
    if (features.product_recommendations) {
      const prodKeywords = ["produs", "pret", "preț", "disponibil", "stoc", "lumanare", "lumânare", "parfum", "cadou", "set", "difuzor", "arom", "recomand", "ceva", "caut", "vreau", "ce aveți", "ce aveti", "ofertă", "reducere"];
      const asksAboutProduct = prodKeywords.some(kw => lowerMsg.includes(kw));
      if (asksAboutProduct && lowerMsg.length > 8) {
        contextPromises.push((async () => {
          const searchWords = message.replace(/[^\w\sșțăîâ]/gi, "").trim();
          if (searchWords.length < 3) return "";
          
          const { data: products } = await supabase
            .from("products")
            .select("name, price, old_price, stock, slug, sku, short_description, rating, review_count")
            .or(`name.ilike.%${searchWords.split(/\s+/).slice(0, 3).join("%")}%`)
            .eq("status", "active")
            .order("rating", { ascending: false })
            .limit(6);

          if (!products?.length) return "\n\n🔍 Nu am găsit produse relevante pentru căutare.";
          
          let ctx = "\n\n🛒 PRODUSE DIN CATALOG (date REALE):\n";
          for (const p of products) {
            const discount = p.old_price && p.old_price > p.price ? ` (redus de la ${p.old_price} RON, -${Math.round((1 - p.price / p.old_price) * 100)}%)` : "";
            const stockLabel = p.stock === 0 ? "❌ Indisponibil" : p.stock && p.stock <= 5 ? `⚠️ Ultimele ${p.stock} bucăți` : "✅ În stoc";
            ctx += `- **${p.name}** | ${p.price} RON${discount} | ${stockLabel} | ${p.rating ? `⭐ ${p.rating}/5 (${p.review_count || 0} recenzii)` : ""} | 👉 /produs/${p.slug}\n`;
            if (p.short_description) ctx += `  → ${(p.short_description as string).slice(0, 120)}\n`;
          }
          return ctx;
        })());
      }
    }

    // 4. Categories context
    if (lowerMsg.includes("categori") || lowerMsg.includes("catalog") || lowerMsg.includes("ce aveți") || lowerMsg.includes("ce aveti") || lowerMsg.includes("tipuri")) {
      contextPromises.push((async () => {
        const { data: cats } = await supabase
          .from("categories")
          .select("name, slug, description")
          .eq("visible", true)
          .order("display_order")
          .limit(15);

        if (!cats?.length) return "";
        let ctx = "\n\n📂 CATEGORII DISPONIBILE ÎN MAGAZIN:\n";
        for (const c of cats) {
          ctx += `- ${c.name} → /catalog/${c.slug}${c.description ? ` (${(c.description as string).slice(0, 80)})` : ""}\n`;
        }
        return ctx;
      })());
    }

    // 5. Active promotions / coupons
    if (lowerMsg.includes("reducere") || lowerMsg.includes("ofertă") || lowerMsg.includes("oferta") || lowerMsg.includes("promo") || lowerMsg.includes("cupon") || lowerMsg.includes("discount") || lowerMsg.includes("cod")) {
      contextPromises.push((async () => {
        const { data: coupons } = await supabase
          .from("coupons")
          .select("code, discount_type, discount_value, min_order_value, valid_until, description")
          .eq("is_active", true)
          .limit(5);

        if (!coupons?.length) return "\n\n🏷️ Nu sunt cupoane publice active momentan.";
        let ctx = "\n\n🏷️ CUPOANE ACTIVE (verifică dacă sunt publice înainte de a le oferi):\n";
        for (const c of coupons) {
          const discountText = c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} RON`;
          ctx += `- **${c.code}**: ${discountText} reducere${c.min_order_value ? ` (min. ${c.min_order_value} RON)` : ""}${c.valid_until ? ` | Valabil până la ${new Date(c.valid_until).toLocaleDateString("ro-RO")}` : ""}\n`;
        }
        return ctx;
      })());
    }

    // 6. Shipping info
    if (lowerMsg.includes("livr") || lowerMsg.includes("transport") || lowerMsg.includes("curier") || lowerMsg.includes("awb") || lowerMsg.includes("colet")) {
      contextPromises.push((async () => {
        const { data: shippingMethods } = await supabase
          .from("shipping_methods")
          .select("name, price, free_threshold, estimated_days, description")
          .eq("is_active", true)
          .limit(10);

        if (!shippingMethods?.length) return "";
        let ctx = "\n\n🚚 METODE DE LIVRARE ACTIVE:\n";
        for (const s of shippingMethods) {
          ctx += `- ${s.name}: ${s.price} RON${s.free_threshold ? ` (gratuit peste ${s.free_threshold} RON)` : ""} | ${s.estimated_days || "1-3"} zile lucrătoare\n`;
        }
        return ctx;
      })());
    }

    // 7. Returns / warranty info
    if (lowerMsg.includes("retur") || lowerMsg.includes("schimb") || lowerMsg.includes("garanție") || lowerMsg.includes("garantie") || lowerMsg.includes("ramburs")) {
      contextPromises.push((async () => {
        const { data: returnSettings } = await supabase
          .from("app_settings")
          .select("value_json")
          .eq("key", "return_settings")
          .maybeSingle();

        const info = returnSettings?.value_json as any;
        if (!info) return "";
        return `\n\n↩️ POLITICA DE RETUR:\n- Termen: ${info.return_window_days || 30} zile\n- Gratuit: ${info.free_returns ? "Da" : "Nu"}\n- Instrucțiuni: Clientul poate iniția returul din contul propriu secțiunea „Retururile mele" sau contactând suportul.`;
      })());
    }

    // Wait for all context
    const contextResults = await Promise.all(contextPromises);
    const dynamicContext = contextResults.filter(Boolean).join("");

    // ─── Store settings for personalization ───
    let storeContext = "";
    try {
      const { data: storeSettings } = await supabase
        .from("app_settings")
        .select("key, value_json")
        .in("key", ["store_settings", "company_info", "checkout_settings"])
        .limit(3);

      if (storeSettings?.length) {
        const store = storeSettings.find(s => s.key === "store_settings")?.value_json as any;
        const company = storeSettings.find(s => s.key === "company_info")?.value_json as any;
        const checkout = storeSettings.find(s => s.key === "checkout_settings")?.value_json as any;
        
        if (store || company) {
          storeContext = "\n\n🏪 DATE MAGAZIN:\n";
          if (company?.name) storeContext += `Nume: ${company.name}\n`;
          if (company?.email) storeContext += `Email suport: ${company.email}\n`;
          if (company?.phone) storeContext += `Telefon: ${company.phone}\n`;
          if (company?.address) storeContext += `Adresă: ${company.address}\n`;
          if (store?.working_hours) storeContext += `Program: ${store.working_hours}\n`;
        }
        if (checkout) {
          storeContext += `\nCheckout: ${checkout.guest_checkout_enabled ? "Se poate comanda fără cont" : "Cont obligatoriu"}\n`;
        }
      }
    } catch {}

    // Build system prompt
    const systemPrompt = `Ești ${settings.assistant_name || "Lucica"}, asistentul virtual al magazinului Mama Lucica — specialist în lumânări artizanale handmade.

🎯 MISIUNEA TA: Să ajuți clienții rapid, cu empatie și precizie, folosind datele REALE din sistemul magazinului.

👤 PERSONALITATE:
- Caldă, prietenoasă, autentică — ca o prietenă care te ajută cu drag
- Expertă pasionată de lumânări, parfumuri și aromaterapie
- Vorbești DOAR în română, cu diacritice corecte
- Ton conversațional natural, nu robotic — variază formulările
- Folosește emoji-uri cu măsură (1-2 per mesaj), natural nu forțat

🧠 INTELIGENȚĂ CONTEXTUALĂ:
- Analizează ce vrea clientul chiar dacă formularea e vagă
- Dacă clientul pare nesigur, oferă opțiuni și ghidaj
- Dacă întreabă de un produs generic, recomandă bestsellere
- Adaptează-ți tonul: formal cu clienți noi, prietenos cu cei care revin
- Când ai date reale din sistem, prezintă-le clar și formatat

📦 CAPACITĂȚILE TALE:
${features.order_tracking ? "✅ Verificare status comenzi în timp real" : ""}
${features.order_cancel ? "✅ Ghidare anulare comenzi (doar dacă nu sunt expediate)" : ""}
${features.return_init ? "✅ Ghidare inițiere retururi" : ""}
${features.invoice_download ? "✅ Informații facturi" : ""}
${features.product_recommendations ? "✅ Recomandări produse, prețuri, disponibilitate" : ""}
${features.faq ? "✅ Răspunsuri FAQ din baza de cunoștințe" : ""}
✅ Informații livrare, plăți, promoții active
✅ Navigare în magazin (link-uri directe către produse/categorii)

🏪 DESPRE MAGAZIN:
- Lumânări artizanale din ceară de soia 100% naturală, vegane, biodegradabile
- Turnate manual în România
- Livrare 1-3 zile lucrătoare prin curier
- Livrare gratuită peste 200 RON
- Retur gratuit 30 zile (OUG 34/2014)
- Plăți: card online, ramburs, transfer bancar, rate Mokka/PayPo
- Personalizare: text gravat, culoare, parfum la alegere

🕯️ SFATURI EXPERT LUMÂNĂRI:
- Prima ardere: 2-3h până se topește uniform toată suprafața (memory ring)
- Fitil: tăiat la 5-6mm înainte de fiecare aprindere
- Nu arde mai mult de 4 ore consecutiv
- Păstrare la loc răcoros, ferit de lumina directă
- Ceara de soia arde ~50% mai lent decât parafina

📏 REGULI:
1. Răspunsuri concise (3-5 propoziții), dar complete
2. Dacă clientul întreabă de o comandă fără număr, cere-i numărul
3. Date reale din sistem = prezintă-le formatat clar
4. NU inventa informații — dacă nu știi, recomandă contact@mamalucica.ro sau WhatsApp
5. Oferă LINK-URI directe când menționezi produse (/produs/slug) sau categorii (/catalog/slug)
6. La întrebări de parfumuri, întreabă preferințele: florale, lemnoase, fructate, fresh, orientale
7. Sugerează produse complementare când e cazul (cross-sell natural)
${storeContext}${faqContext}${dynamicContext}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-16),
      { role: "user", content: message },
    ];

    // Stream response
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        max_tokens: 600,
        stream: true,
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

    // Return SSE stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ reply: "Ne cerem scuze, a apărut o eroare. Vă rugăm să încercați din nou. 🙏" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
