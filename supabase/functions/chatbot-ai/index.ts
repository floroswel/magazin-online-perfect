import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, conversationHistory, sessionId, userEmail } = await req.json();

    // ── Input validation ──
    if (!message || typeof message !== "string" || message.trim().length === 0 || message.length > 2000) {
      return json({ message: "Mesaj invalid. Te rog scrie un mesaj (max 2000 caractere).", quickReplies: ["Ce lumânări aveți?", "Cât costă livrarea?"] });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // ── Load chatbot_* settings from app_settings ──
    const { data: settingsRows } = await supabase
      .from("app_settings")
      .select("key, value_json")
      .like("key", "chatbot_%");

    const cfg: Record<string, string> = {};
    for (const r of settingsRows || []) {
      const v = r.value_json;
      cfg[r.key] = typeof v === "string" ? v : JSON.stringify(v);
    }

    const enabled = cfg.chatbot_enabled !== "false";
    if (!enabled) {
      return json({ message: cfg.chatbot_offline_message || "Chatbot-ul este momentan dezactivat.", showContactForm: true });
    }

    // ── Detect user from auth header ──
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: claims } = await supabase.auth.getClaims(token);
        if (claims?.claims?.sub) userId = claims.claims.sub as string;
      } catch { /* anonymous user */ }
    }

    if (!lovableKey) {
      return json({ message: "Mulțumesc pentru mesaj! Un operator va reveni în curând.", showContactForm: true });
    }

    const lowerMsg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // ══════════════════════════════════════════
    // PARALLEL CONTEXT LOADING
    // ══════════════════════════════════════════
    const contextParts: Promise<{ text: string; products?: any[] }>[] = [];

    // 1. Categories (always)
    contextParts.push((async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("name, slug, description")
        .eq("visible", true)
        .order("display_order")
        .limit(30);
      if (!cats?.length) return { text: "" };
      let t = "\n\n📂 CATEGORII MAGAZIN:\n";
      for (const c of cats) t += `- ${c.name} → /catalog/${c.slug}\n`;
      return { text: t };
    })());

    // 2. Top products (always)
    contextParts.push((async () => {
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price, old_price, stock, slug, image_url, rating, short_description, total_sold")
        .eq("status", "active")
        .gt("stock", 0)
        .order("total_sold", { ascending: false })
        .limit(20);
      if (!prods?.length) return { text: "" };
      let t = "\n\n🏆 TOP PRODUSE DISPONIBILE:\n";
      for (const p of prods) {
        const disc = p.old_price && p.old_price > p.price ? ` ~~${p.old_price} RON~~ (-${Math.round((1 - p.price / p.old_price) * 100)}%)` : "";
        t += `- **${p.name}** | ${p.price} RON${disc} | stoc: ${p.stock} | /produs/${p.slug}\n`;
      }
      return { text: t, products: prods.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, slug: p.slug })) };
    })());

    // 3. Order lookup (if message mentions order)
    const orderMatch = message.match(/(?:comanda|comandă|order|#|colet|tracking)\s*([A-Za-z0-9-]{4,})/i)
      || message.match(/\b([0-9]{5,8})\b/)
      || message.match(/\b([0-9a-fA-F]{8})\b/);

    if (orderMatch) {
      contextParts.push((async () => {
        const term = orderMatch[1];
        const { data: orders } = await supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, shipping_status, tracking_number, courier, payment_method, payment_status, user_id")
          .or(`order_number.eq.${term},order_number.ilike.%${term}%,id.ilike.${term}%`)
          .limit(3);

        if (!orders?.length) return { text: `\n\n⚠️ COMANDĂ NEGĂSITĂ: "${term}" nu există. Cere clientului să verifice email-ul de confirmare.` };

        // GDPR: only show user's own orders
        const safe = userId ? orders.filter(o => o.user_id === userId) : [];
        if (safe.length === 0 && userId) {
          return { text: "\n\n🔒 Comanda aparține altui cont. NU afișa detalii." };
        }
        if (safe.length === 0 && !userId) {
          return { text: "\n\n🔒 Clientul nu e autentificat. Cere-i să se logheze pentru a vedea comanda." };
        }

        const statusLabels: Record<string, string> = {
          pending: "⏳ În așteptare", processing: "🔄 În procesare", confirmed: "✅ Confirmată",
          shipped: "📦 Expediată", delivered: "✅ Livrată", cancelled: "❌ Anulată",
          refunded: "💰 Rambursată", pending_payment: "💳 Așteaptă plata",
        };

        let t = "\n\n📋 COMENZI GĂSITE:\n";
        for (const o of safe) {
          t += `═══════\n📦 #${o.order_number || o.id.slice(0, 8)}\n`;
          t += `├ Status: ${statusLabels[o.status] || o.status}\n`;
          t += `├ Total: ${o.total} RON | Plată: ${o.payment_method || "N/A"} (${o.payment_status || "N/A"})\n`;
          t += `├ Data: ${new Date(o.created_at).toLocaleDateString("ro-RO")}\n`;
          if (o.tracking_number) t += `├ AWB: ${o.tracking_number}${o.courier ? ` (${o.courier})` : ""}\n`;
          t += `═══════\n`;
        }
        // GDPR: DO NOT include address, phone, other personal data
        return { text: t };
      })());
    }

    // 4. User's orders (if logged in and asks generally)
    if (userId && !orderMatch && (lowerMsg.includes("comand") || lowerMsg.includes("unde") || lowerMsg.includes("comenzile mele") || lowerMsg.includes("istoric"))) {
      contextParts.push((async () => {
        const { data: uo } = await supabase
          .from("orders")
          .select("order_number, status, total, created_at, tracking_number, courier")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (!uo?.length) return { text: "\n\nClientul NU are comenzi." };
        const labels: Record<string, string> = { pending: "Așteptare", processing: "Procesare", confirmed: "Confirmată", shipped: "Expediată", delivered: "Livrată", cancelled: "Anulată" };
        let t = "\n\n📋 COMENZILE CLIENTULUI:\n";
        for (const o of uo) {
          t += `- #${o.order_number} | ${labels[o.status] || o.status} | ${o.total} RON | ${new Date(o.created_at).toLocaleDateString("ro-RO")}${o.tracking_number ? ` | AWB: ${o.tracking_number}` : ""}\n`;
        }
        return { text: t };
      })());
    }

    // 5. Product search (specific product queries)
    const prodKW = ["produs", "pret", "preț", "stoc", "lumanare", "lumânare", "parfum", "cadou", "set", "difuzor", "arom", "recomand", "caut", "vreau", "ce aveți", "miros", "vanilie", "lavand", "trandafir", "floral", "lemn"];
    const asksProduct = prodKW.some(k => lowerMsg.includes(k));
    if (asksProduct && lowerMsg.length > 8) {
      contextParts.push((async () => {
        const words = message.replace(/[^\w\sșțăîâ]/gi, "").trim();
        if (words.length < 3) return { text: "" };
        const { data: found } = await supabase.rpc("search_products", { search_term: words, result_limit: 6 });
        if (!found?.length) {
          // fallback
          const { data: fb } = await supabase
            .from("products")
            .select("id, name, price, slug, image_url, stock")
            .eq("status", "active")
            .gt("stock", 0)
            .or(`name.ilike.%${words.split(/\s+/).slice(0, 2).join("%")}%`)
            .limit(6);
          if (!fb?.length) return { text: "\n\n🔍 Nu am găsit produse relevante." };
          let t = "\n\n🔍 PRODUSE GĂSITE:\n";
          for (const p of fb) t += `- **${p.name}** | ${p.price} RON | /produs/${p.slug}\n`;
          return { text: t, products: fb.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, slug: p.slug })) };
        }
        let t = "\n\n🔍 PRODUSE GĂSITE:\n";
        for (const p of found as any[]) t += `- **${p.name}** | ${p.price} RON | ${p.brand || ""} | /produs/${p.slug}\n`;
        return { text: t, products: (found as any[]).slice(0, 3).map((p: any) => ({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, slug: p.slug })) };
      })());
    }

    // 6. Promotions/coupons
    if (lowerMsg.includes("reducere") || lowerMsg.includes("ofert") || lowerMsg.includes("promo") || lowerMsg.includes("cupon") || lowerMsg.includes("discount") || lowerMsg.includes("cod")) {
      contextParts.push((async () => {
        const now = new Date().toISOString();
        const { data: c } = await supabase
          .from("coupons")
          .select("code, discount_type, discount_value, min_order_value, valid_until, first_order_only")
          .eq("is_active", true)
          .or(`valid_until.is.null,valid_until.gte.${now}`)
          .limit(5);
        if (!c?.length) return { text: "\n\n🏷️ Nu sunt cupoane active. Sugerează newsletter." };
        let t = "\n\n🏷️ PROMOȚII ACTIVE:\n";
        for (const x of c) {
          const d = x.discount_type === "percentage" ? `${x.discount_value}%` : `${x.discount_value} RON`;
          t += `- **${x.code}**: ${d}${x.min_order_value ? ` (min ${x.min_order_value} RON)` : ""}${x.first_order_only ? " (prima comandă)" : ""}\n`;
        }
        return { text: t };
      })());
    }

    // 7. Shipping
    if (lowerMsg.includes("livr") || lowerMsg.includes("transport") || lowerMsg.includes("curier") || lowerMsg.includes("colet") || lowerMsg.includes("gratu")) {
      contextParts.push((async () => {
        const { data: m } = await supabase
          .from("shipping_methods")
          .select("name, price, free_threshold, estimated_days")
          .eq("is_active", true)
          .limit(10);
        if (!m?.length) return { text: "\n\n🚚 Livrare standard 1-3 zile, gratuită peste 200 RON." };
        let t = "\n\n🚚 METODE LIVRARE:\n";
        for (const s of m) t += `- **${s.name}**: ${s.price} RON${s.free_threshold ? ` (GRATUIT peste ${s.free_threshold} RON)` : ""} | ${s.estimated_days || "1-3"} zile\n`;
        return { text: t };
      })());
    }

    // 8. Return policy
    if (lowerMsg.includes("retur") || lowerMsg.includes("returnare") || lowerMsg.includes("schimb")) {
      contextParts.push(Promise.resolve({
        text: "\n\n↩️ RETUR:\n- 14 zile drept retragere (OUG 34/2014), termen extins 30 zile\n- Retur GRATUIT, produs nefolosit, ambalaj original\n- Inițiere: cont → Retururi sau contact@mamalucica.ro\n- Ramburs în 14 zile pe metoda originală",
      }));
    }

    // 9. Payment
    if (lowerMsg.includes("plat") || lowerMsg.includes("card") || lowerMsg.includes("ramburs") || lowerMsg.includes("transfer") || lowerMsg.includes("rate") || lowerMsg.includes("mokka")) {
      contextParts.push(Promise.resolve({
        text: "\n\n💳 PLATĂ:\n- Card online (Visa/MC) prin Netopia 3D Secure\n- Ramburs (cash/card la curier)\n- Transfer bancar\n- Rate fără dobândă: Mokka (3-12 rate), PayPo (plată în 30 zile)",
      }));
    }

    // 10. FAQ
    contextParts.push((async () => {
      const { data: faq } = await supabase.from("chatbot_faq").select("question, answer").eq("active", true).order("sort_order").limit(20);
      if (!faq?.length) return { text: "" };
      let t = "\n\n❓ FAQ:\n";
      for (const f of faq) t += `Î: ${f.question}\nR: ${f.answer}\n\n`;
      return { text: t };
    })());

    // 11. Profile (if logged in)
    if (userId) {
      contextParts.push((async () => {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
        return { text: p?.full_name ? `\n\n👤 Client: ${p.full_name}. Folosește prenumele.` : "" };
      })());
    }

    // Wait for all context
    const results = await Promise.all(contextParts);
    const dynamicContext = results.map(r => r.text).filter(Boolean).join("");
    const foundProducts = results.flatMap(r => r.products || []).slice(0, parseInt(cfg.chatbot_max_products_recommend || "3"));

    // ══════════════════════════════════════════
    // SYSTEM PROMPT
    // ══════════════════════════════════════════
    const personalityPrompt = cfg.chatbot_personality_prompt || "Ești un asistent virtual util și prietenos.";

    const systemPrompt = `${personalityPrompt}

═══ DATE MAGAZIN ═══
🏪 Mama Lucica — Lumânări Artizanale Handmade
📞 contact@mamalucica.ro | WhatsApp: +40753326405
🌐 mamalucica.ro

═══ EXPERTIZĂ LUMÂNĂRI ═══
- Prima ardere: lasă 2-3h să se topească uniform (memory burn)
- Fitil: tăiat la 5-6mm înainte de aprindere
- Durată maximă: 4h consecutiv
- Ceara de soia: arde ~50% mai lent, nu eliberează toxine, vegană

═══ REGULI STRICTE ═══
🚫 ANTI-HALUCINARE:
1. Răspunzi DOAR cu date REALE din context
2. NU inventa prețuri, coduri, AWB-uri
3. Dacă nu găsești comanda = "Nu am găsit. Verifică email-ul de confirmare."
4. Dacă nu știi = "Te rog contactează-ne la contact@mamalucica.ro"

🔒 GDPR:
1. NU afișa date personale ale altor clienți
2. Comenzile DOAR proprietarului (verificat prin user_id)
3. Nelogați = "Autentifică-te pentru a vedea comenzile"
4. NU oferi CUI/IBAN decât la cerere specifică de facturare

📝 FORMAT:
- Max 4-6 propoziții, concis dar complet
- Markdown: **bold**, linkuri /produs/slug
- Sugerează pași următori
${dynamicContext}`;

    const maxTokens = parseInt(cfg.chatbot_max_tokens || "500");

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).slice(-16),
      { role: "user", content: message },
    ];

    // ── Call Lovable AI ──
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.chatbot_model || "google/gemini-3-flash-preview",
        messages: aiMessages,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!aiResp.ok) {
      const st = aiResp.status;
      await aiResp.text(); // consume body
      if (st === 429) return json({ message: "Sunt momentan ocupată. Încearcă din nou în câteva secunde. ⏳", showContactForm: true }, 429);
      if (st === 402) return json({ message: "Contactează-ne la contact@mamalucica.ro. 📧", showContactForm: true }, 402);
      return json({ message: "Echipa noastră va reveni cu un răspuns. 🙏", showContactForm: true });
    }

    const aiData = await aiResp.json();
    const reply = aiData.choices?.[0]?.message?.content || "Mulțumesc! 😊";

    // ── Quick replies logic ──
    const quickRepliesStr = cfg.chatbot_quick_replies || "";
    const allQuickReplies = quickRepliesStr.split("|").map(s => s.trim()).filter(Boolean);
    // Pick contextual quick replies
    let quickReplies: string[] = [];
    if (lowerMsg.includes("comand") || lowerMsg.includes("livr")) {
      quickReplies = ["Care e statusul comenzii?", "Cât durează livrarea?", "Vreau să returnez un produs"];
    } else if (lowerMsg.includes("retur")) {
      quickReplies = ["Cum inițiez un retur?", "Cât durează rambursul?", "Ce lumânare recomandați?"];
    } else if (asksProduct) {
      quickReplies = ["Ce lumânare recomandați cadou?", "Aveți reduceri?", "Cât costă livrarea?"];
    } else {
      quickReplies = allQuickReplies.slice(0, 5);
    }

    // ── Determine if contact form needed ──
    const showContactForm = reply.includes("contact@mamalucica.ro") || reply.includes("nu am această informație");

    // ── Save to chatbot_messages if sessionId ──
    if (sessionId) {
      await Promise.all([
        supabase.from("chatbot_messages").insert({ session_id: sessionId, role: "user", content: message }),
        supabase.from("chatbot_messages").insert({ session_id: sessionId, role: "assistant", content: reply }),
      ]).catch(() => {});
    }

    // ── Structured response ──
    const response: any = {
      message: reply,
      quickReplies,
    };

    if (foundProducts.length > 0) {
      response.products = foundProducts;
    }

    if (showContactForm) {
      response.showContactForm = true;
    }

    return json(response);

  } catch (err) {
    console.error("chatbot-ai error:", err);
    return json({
      message: "Ne cerem scuze, a apărut o eroare. Contactează-ne la contact@mamalucica.ro 🙏",
      showContactForm: true,
      quickReplies: ["Cum vă contactez?", "Ce lumânări aveți?"],
    });
  }
});
