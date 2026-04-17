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
    const { message, history, sessionId, userId, gdprConsent } = await req.json();

    // ─── Input validation ───
    if (!message || typeof message !== "string" || message.trim().length === 0 || message.length > 1000) {
      return new Response(JSON.stringify({ reply: "Vă rog să scrieți un mesaj valid (max 1000 caractere)." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── GDPR: refuse to process without consent ───
    if (gdprConsent === false) {
      return new Response(JSON.stringify({
        reply: "Pentru a utiliza asistentul virtual, este necesar să accepți prelucrarea datelor conform GDPR. Datele conversației sunt stocate temporar doar pentru a-ți oferi suport. 🔒",
        requiresConsent: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Load settings ───
    const { data: settingsRow } = await supabase.from("chatbot_settings").select("*").limit(1).maybeSingle();
    const settings = settingsRow || { enabled: true, features_enabled: {}, escalate_keywords: "", assistant_name: "Lucica" };

    if (!settings.enabled) {
      return new Response(JSON.stringify({ reply: settings.offline_message || "Chatbot-ul este momentan dezactivat." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Escalation check ───
    const keywords = (settings.escalate_keywords || "").split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean);
    const lowerMsg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const shouldEscalate = keywords.some((kw: string) => lowerMsg.includes(kw));

    if (shouldEscalate) {
      if (sessionId) {
        await supabase.from("chatbot_sessions").update({ status: "escalated" }).eq("id", sessionId);
      }
      return new Response(JSON.stringify({
        reply: "Înțeleg preocuparea ta. Voi transfera conversația către un coleg din echipa de suport care te va putea ajuta mai bine. Vei fi contactat în cel mai scurt timp la adresa de email asociată contului tău. 🤝\n\nPoți de asemenea să ne contactezi direct:\n- 📧 contact@mamalucica.ro\n- 📱 WhatsApp: +40753326405",
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

    // ═══════════════════════════════════════════════
    // PARALLEL DATA LOADING — all store dimensions
    // ═══════════════════════════════════════════════
    const contextPromises: Promise<string>[] = [];

    // ── 1. ALWAYS load categories (small table) ──
    contextPromises.push((async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("name, slug, description, parent_id")
        .eq("visible", true)
        .order("display_order")
        .limit(30);

      if (!cats?.length) return "";
      let ctx = "\n\n📂 CATEGORII MAGAZIN (toate disponibile):\n";
      for (const c of cats) {
        ctx += `- ${c.name} → /catalog/${c.slug}${c.description ? ` — ${(c.description as string).slice(0, 100)}` : ""}\n`;
      }
      return ctx;
    })());

    // ── 2. ALWAYS load top products (bestsellers + new arrivals) ──
    contextPromises.push((async () => {
      const { data: topProducts } = await supabase
        .from("products")
        .select("name, price, old_price, stock, slug, rating, review_count, short_description, total_sold")
        .eq("status", "active")
        .order("total_sold", { ascending: false })
        .limit(10);

      if (!topProducts?.length) return "";
      let ctx = "\n\n🏆 TOP PRODUSE (bestsellere reale din magazin):\n";
      for (const p of topProducts) {
        const discount = p.old_price && p.old_price > p.price
          ? ` ~~${p.old_price} RON~~ (-${Math.round((1 - p.price / p.old_price) * 100)}%)`
          : "";
        const stockLabel = p.stock === 0 ? "❌ Stoc epuizat" : p.stock <= 3 ? `⚠️ Ultimele ${p.stock} buc.` : `✅ ${p.stock} în stoc`;
        ctx += `- **${p.name}** | **${p.price} RON**${discount} | ${stockLabel} | ${p.rating ? `⭐ ${p.rating}/5` : ""} | ${p.total_sold || 0} vândute | /produs/${p.slug}\n`;
      }
      return ctx;
    })());

    // ── 3. Order lookup by number ──
    const orderNumMatch = message.match(/(?:comanda|comandă|order|#)\s*([A-Za-z0-9-]{4,})/i)
      || message.match(/\b([0-9]{5,8})\b/)
      || message.match(/\b([0-9a-fA-F]{8})\b/);

    if (orderNumMatch) {
      contextPromises.push((async () => {
        const searchTerm = orderNumMatch[1];
        // First try exact match, then fuzzy
        const { data: foundOrders } = await supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, shipping_status, payment_status, tracking_number, courier, payment_method, shipping_address, items, user_id, user_email")
          .or(`order_number.eq.${searchTerm},order_number.ilike.%${searchTerm}%,id.ilike.${searchTerm}%`)
          .limit(3);

        if (!foundOrders?.length) {
          return `\n\n⚠️ COMANDĂ NEGĂSITĂ: Nu am găsit nicio comandă cu identificatorul "${searchTerm}". IMPORTANT: Informează clientul că numărul nu există în sistem și cere-i să verifice numărul exact din email-ul de confirmare.`;
        }

        // GDPR: If user is logged in, only show their orders
        const filteredOrders = userId
          ? foundOrders.filter(o => o.user_id === userId)
          : foundOrders;

        if (filteredOrders.length === 0 && userId) {
          return "\n\n🔒 SECURITATE: Comanda găsită aparține altui cont. NU afișa detalii. Informează clientul că nu are acces la această comandă și să verifice contul corect.";
        }

        const ordersToShow = filteredOrders.length > 0 ? filteredOrders : foundOrders;

        const statusLabels: Record<string, string> = {
          pending: "⏳ În așteptare", processing: "🔄 În procesare", confirmed: "✅ Confirmată",
          shipped: "📦 Expediată", delivered: "✅ Livrată", cancelled: "❌ Anulată",
          returned: "↩️ Returnată", refunded: "💰 Rambursată", pending_payment: "💳 Așteaptă plata",
        };

        let ctx = "\n\n📋 COMENZI GĂSITE (date REALE din baza de date — prezintă-le clientului):\n";
        for (const o of ordersToShow) {
          const addr = o.shipping_address as any;
          const items = Array.isArray(o.items) ? (o.items as any[]) : [];
          const itemsList = items.slice(0, 5).map((i: any) =>
            `  • ${i.name || i.product_name || "Produs"} x${i.quantity || 1} — ${i.price || "N/A"} RON`
          ).join("\n");

          ctx += `═══════════════════════════
📦 Comandă #${o.order_number || o.id.slice(0, 8)}
├ Status: ${statusLabels[o.status] || o.status}
├ Total: ${o.total} RON
├ Plată: ${o.payment_method || "N/A"} (${o.payment_status || "N/A"})
├ Livrare: ${o.shipping_status || "în pregătire"}${o.tracking_number ? `\n├ AWB: ${o.tracking_number}` : ""}${o.courier ? ` (${o.courier})` : ""}
├ Data: ${o.created_at ? new Date(o.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}
├ Destinatar: ${addr?.fullName || "N/A"}, ${addr?.city || ""}, ${addr?.county || ""}
${itemsList ? `├ Produse:\n${itemsList}` : ""}
═══════════════════════════\n`;
        }
        return ctx;
      })());
    }

    // ── 4. User's own orders (if logged in, no specific order asked) ──
    if (userId && !orderNumMatch && (lowerMsg.includes("comand") || lowerMsg.includes("unde") || lowerMsg.includes("status") || lowerMsg.includes("comenzile mele") || lowerMsg.includes("istoric"))) {
      contextPromises.push((async () => {
        const { data: userOrders } = await supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, shipping_status, tracking_number, courier, items")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!userOrders?.length) return "\n\n📋 Clientul NU are comenzi în cont. Informează-l că poate plasa prima comandă din catalog.";

        const statusLabels: Record<string, string> = {
          pending: "⏳ Așteptare", processing: "🔄 Procesare", confirmed: "✅ Confirmată",
          shipped: "📦 Expediată", delivered: "✅ Livrată", cancelled: "❌ Anulată",
        };
        let ctx = "\n\n📋 COMENZILE CLIENTULUI (ultimele, din contul său):\n";
        for (const o of userOrders) {
          const items = Array.isArray(o.items) ? (o.items as any[]) : [];
          const summary = items.slice(0, 3).map((i: any) => i.name || i.product_name || "Produs").join(", ");
          ctx += `- #${o.order_number || o.id.slice(0, 8)} | ${statusLabels[o.status] || o.status} | ${o.total} RON | ${new Date(o.created_at).toLocaleDateString("ro-RO")}${o.tracking_number ? ` | AWB: ${o.tracking_number} (${o.courier || ""})` : ""} | ${summary}\n`;
        }
        return ctx;
      })());
    }

    // ── 5. Product search (when asking about specific products) ──
    const prodKeywords = ["produs", "pret", "preț", "disponibil", "stoc", "lumanare", "lumânare", "parfum", "cadou", "set", "difuzor", "arom", "recomand", "ceva frumos", "caut", "vreau", "ce aveți", "ce aveti", "pentru", "miros", "lemn", "vanilie", "lavand", "trandafir", "floral"];
    const asksAboutProduct = prodKeywords.some(kw => lowerMsg.includes(kw));
    if (asksAboutProduct && lowerMsg.length > 8) {
      contextPromises.push((async () => {
        const searchWords = message.replace(/[^\w\sșțăîâ]/gi, "").trim();
        if (searchWords.length < 3) return "";

        // Use the search_products function for better results
        const { data: products } = await supabase
          .rpc("search_products", { search_term: searchWords, result_limit: 8 });

        if (products?.length) {
          let ctx = "\n\n🔍 PRODUSE GĂSITE PRIN CĂUTARE (rezultate reale):\n";
          for (const p of products as any[]) {
            ctx += `- **${p.name}** | ${p.price} RON | ${p.brand || ""} | ${p.category_name || ""} | /produs/${p.slug}\n`;
          }
          return ctx;
        }

        // Fallback to direct query
        const { data: fallbackProducts } = await supabase
          .from("products")
          .select("name, price, old_price, stock, slug, short_description, rating")
          .eq("status", "active")
          .or(`name.ilike.%${searchWords.split(/\s+/).slice(0, 3).join("%")}%`)
          .order("rating", { ascending: false })
          .limit(6);

        if (!fallbackProducts?.length) return "\n\n🔍 Nu am găsit produse relevante. Sugerează clientului să navigheze catalogul (/catalog) sau să-și precizeze preferințele.";

        let ctx = "\n\n🔍 PRODUSE RELEVANTE:\n";
        for (const p of fallbackProducts) {
          const discount = p.old_price && p.old_price > p.price ? ` (~~${p.old_price}~~ -${Math.round((1 - p.price / p.old_price) * 100)}%)` : "";
          const stockLabel = p.stock === 0 ? "❌ Indisponibil" : p.stock && p.stock <= 3 ? `⚠️ Ultimele ${p.stock}` : "✅ În stoc";
          ctx += `- **${p.name}** | ${p.price} RON${discount} | ${stockLabel} | /produs/${p.slug}\n`;
        }
        return ctx;
      })());
    }

    // ── 6. Promotions / coupons ──
    if (lowerMsg.includes("reducere") || lowerMsg.includes("ofertă") || lowerMsg.includes("oferta") || lowerMsg.includes("promo") || lowerMsg.includes("cupon") || lowerMsg.includes("discount") || lowerMsg.includes("cod")) {
      contextPromises.push((async () => {
        const now = new Date().toISOString();
        const { data: coupons } = await supabase
          .from("coupons")
          .select("code, discount_type, discount_value, min_order_value, valid_until, description, first_order_only")
          .eq("is_active", true)
          .or(`valid_until.is.null,valid_until.gte.${now}`)
          .limit(5);

        if (!coupons?.length) return "\n\n🏷️ Nu sunt cupoane active momentan. Sugerează clientului să se aboneze la newsletter pentru a primi oferte exclusive.";
        let ctx = "\n\n🏷️ PROMOȚII ACTIVE (date reale):\n";
        for (const c of coupons) {
          const discountText = c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value} RON`;
          ctx += `- Cod: **${c.code}** → ${discountText} reducere${c.min_order_value ? ` (min. ${c.min_order_value} RON)` : ""}${c.first_order_only ? " (doar prima comandă)" : ""}${c.valid_until ? ` | Expiră: ${new Date(c.valid_until).toLocaleDateString("ro-RO")}` : ""}\n`;
        }
        return ctx;
      })());
    }

    // ── 7. Shipping methods ──
    if (lowerMsg.includes("livr") || lowerMsg.includes("transport") || lowerMsg.includes("curier") || lowerMsg.includes("awb") || lowerMsg.includes("colet") || lowerMsg.includes("gratu")) {
      contextPromises.push((async () => {
        const { data: methods } = await supabase
          .from("shipping_methods")
          .select("name, price, free_threshold, estimated_days, description")
          .eq("is_active", true)
          .limit(10);

        if (!methods?.length) return "\n\n🚚 Livrare: standard 1-3 zile lucrătoare, gratuită peste 200 RON.";
        let ctx = "\n\n🚚 METODE LIVRARE ACTIVE (date reale):\n";
        for (const s of methods) {
          ctx += `- **${s.name}**: ${s.price} RON${s.free_threshold ? ` (GRATUIT peste ${s.free_threshold} RON)` : ""} | ${s.estimated_days || "1-3"} zile lucrătoare${s.description ? ` — ${s.description}` : ""}\n`;
        }
        return ctx;
      })());
    }

    // ── 8. Return policy ──
    if (lowerMsg.includes("retur") || lowerMsg.includes("schimb") || lowerMsg.includes("garanție") || lowerMsg.includes("garantie") || lowerMsg.includes("ramburs") || lowerMsg.includes("nemulțumit") || lowerMsg.includes("nemultumit")) {
      contextPromises.push((async () => {
        return `\n\n↩️ POLITICA RETUR (informații oficiale):\n- Drept de retragere: 14 zile conform OUG 34/2014\n- Termen extins: 30 zile de la primire\n- Costul returului: GRATUIT\n- Condiție: produsul trebuie să fie nefolosit, în ambalajul original\n- Cum se inițiază: din contul clientului → secțiunea "Retururile mele" sau prin email la contact@mamalucica.ro\n- Rambursare: în 14 zile de la primirea produsului returnat, pe metoda de plată originală`;
      })());
    }

    // ── 9. Payment methods ──
    if (lowerMsg.includes("plat") || lowerMsg.includes("card") || lowerMsg.includes("ramburs") || lowerMsg.includes("transfer") || lowerMsg.includes("rate") || lowerMsg.includes("mokka") || lowerMsg.includes("paypo")) {
      contextPromises.push((async () => {
        return `\n\n💳 METODE DE PLATĂ ACCEPTATE:\n- **Card online** (Visa, Mastercard) — prin Netopia, securizat 3D Secure\n- **Ramburs** (plata la livrare) — cash sau card la curier\n- **Transfer bancar** — IBAN: RO50BTRLRONCRT0566231601, Banca Transilvania\n- **Rate fără dobândă** — prin Mokka (3-12 rate) sau PayPo (plătești peste 30 zile)\n- Toate tranzacțiile sunt securizate și protejate`;
      })());
    }

    // ── 10. FAQ ──
    contextPromises.push((async () => {
      const { data: faqData } = await supabase.from("chatbot_faq").select("question, answer, category").eq("active", true).order("sort_order");
      if (!faqData?.length) return "";
      let ctx = "\n\n❓ FAQ (bază de cunoștințe verificată):\n";
      for (const f of faqData as any[]) {
        ctx += `Î: ${f.question}\nR: ${f.answer}\n\n`;
      }
      return ctx;
    })());

    // ── 11. User profile (if logged in) ──
    if (userId) {
      contextPromises.push((async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", userId)
          .maybeSingle();

        if (!profile) return "\n\n👤 Client: neautentificat sau profil incomplet.";
        return `\n\n👤 PROFIL CLIENT (date din cont):\n- Nume: ${profile.full_name || "Necompletat"}\n- Telefon: ${profile.phone || "Necompletat"}\n- GDPR: Folosește prenumele dacă e disponibil, pentru un ton personalizat.`;
      })());
    }

    // ── 12. Store stats for credibility ──
    contextPromises.push((async () => {
      const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
      const { data: reviewStats } = await supabase.from("reviews").select("rating").limit(500);
      const avgRating = reviewStats?.length
        ? (reviewStats.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviewStats.length).toFixed(1)
        : "N/A";
      return `\n\n📊 STATISTICI MAGAZIN:\n- ${productCount || 0} produse active în catalog\n- ${orderCount || 0} comenzi procesate\n- ${reviewStats?.length || 0} recenzii, rating mediu: ${avgRating}/5`;
    })());

    // Wait for ALL context data
    const contextResults = await Promise.all(contextPromises);
    const dynamicContext = contextResults.filter(Boolean).join("");

    // ═══════════════════════════════════════════════
    // SYSTEM PROMPT — ultra-detailed brand knowledge
    // ═══════════════════════════════════════════════
    const systemPrompt = `Ești "${settings.assistant_name || "Lucica"}", asistentul virtual al magazinului online Mama Lucica (mamalucica.ro).

═══ IDENTITATE BRAND ═══
🏪 **Mama Lucica** — Lumânări Artizanale Handmade
- Fundatoare: inspirat de „mama Lucica", o femeie care a turnat prima lumânare în bucătăria casei
- Filosofie: fiecare lumânare e creată cu dragoste, ca un cadou de la mamă
- Valori: artizanat românesc, ingrediente naturale, sustenabilitate, grijă pentru detalii
- Slogan: „Lumânări handmade din ceară de soia, create cu dragoste în România."
- Website: mamalucica.ro

🏢 **Date firmă** (doar pentru facturare/legal, NU le oferi nesolicitat):
- SC Vomix Genius SRL, CUI: 43025661
- Strada Constructorilor 39, Voievoda, Teleorman, România

📞 **Contact:**
- Email: contact@mamalucica.ro
- WhatsApp/Telefon: +40753326405
- Program suport: Luni-Vineri 09:00-18:00

═══ PERSONALITATE ═══
- Ești caldă, empatică și autentică — vorbești ca o prietenă de încredere
- Ești pasionată și expertă în lumânări, parfumuri, aromaterapie
- Adaptezi tonul: prietenos cu clienții recurenți, politicos dar cald cu cei noi
- Folosești prenumele clientului când îl cunoști (din profil)
- Vorbești EXCLUSIV în română, cu diacritice corecte (ș, ț, ă, î, â)
- Emoji-uri: max 1-2 per mesaj, natural și cu gust
- Eviți formulări robotice ("Sunt un asistent AI", "Ca model de limbaj...")
- NU menționezi niciodată că ești AI/chatbot decât dacă ești întrebată direct

═══ EXPERTIZĂ LUMÂNĂRI ═══
🕯️ **Sfaturi profesionale:**
- Prima ardere (memory burn): lasă lumânarea 2-3h să se topească uniform pe toată suprafața
- Fitil: tăiat la 5-6mm înainte de fiecare aprindere cu un croitor de fitil
- Durata maximă: nu arde mai mult de 4h consecutiv
- Depozitare: loc răcoros, ferit de lumina directă a soarelui
- Ceara de soia arde ~50% mai lent decât parafina
- Avantaje soia: nu eliberează toxine, arde curat, biodegradabilă, vegană
- Sticlele pot fi refolosite: spălare cu apă caldă după terminarea lumânării

🌸 **Ghid parfumuri:**
- Florale: trandafir, iasomie, lavandă — relaxare, romantism
- Lemnoase: cedru, santal, patchouli — căldură, eleganță
- Fructate: piersică, coacăze, citrice — energie, prospețime
- Fresh: eucalipt, mentă, bambus — purificare, revigorare
- Orientale: vanilie, scorțișoară, ambră — confort, nostalgie
- Gourmand: cafea, ciocolată, caramel — mângâiere, indulgență

═══ CUNOȘTINȚE MAGAZIN ═══
💰 **Prețuri & Oferte:**
- Livrare gratuită la comenzi peste 200 RON
- Rate fără dobândă prin Mokka (3-12 rate) și PayPo (plată în 30 zile)
- Personalizare disponibilă: text gravat, culoare, parfum la alegere

🎁 **Cadouri & Ocazii:**
- Seturi cadou gata ambalate
- Personalizare pentru nunți, botezuri, aniversări, corporate
- Ambalaj cadou disponibil la checkout

═══ REGULI STRICTE (respectă-le ÎNTOTDEAUNA) ═══

🚫 **ANTI-HALUCINARE:**
1. Răspunzi DOAR cu date REALE din context. Dacă nu ai date despre un produs/comandă/preț = spui sincer
2. NU inventa numere de comandă, prețuri, coduri de cupon, AWB-uri sau orice alt dat
3. NU confirma existența unui produs dacă nu apare în contextul tău
4. Dacă nu găsești comanda = "Nu am găsit această comandă. Te rog verifică numărul din email-ul de confirmare."
5. Dacă nu știi răspunsul = "Nu am această informație. Te rog contactează-ne la contact@mamalucica.ro"

🔒 **GDPR & SECURITATE:**
1. NU afișa date personale ale altor clienți (email, telefon, adrese)
2. Comenzile sunt afișate DOAR proprietarului (verificare prin user_id)
3. Pentru clienți nelogați care cer status comandă = "Te rog autentifică-te în cont pentru a vedea comenzile tale"
4. NU oferi date firmă (CUI, IBAN) decât dacă clientul întreabă specific de facturare
5. Conversațiile sunt stocate temporar doar pentru calitatea suportului

📝 **FORMAT RĂSPUNS:**
1. Maxim 4-6 propoziții per răspuns (concis dar complet)
2. Folosește formatare Markdown: **bold** pentru accent, linkuri ca text
3. Când menționezi produse, include linkul: /produs/slug-ul
4. Când recomanzi categorii, include linkul: /catalog/slug
5. La întrebări multiple, răspunde pe puncte
6. Sugerează pașii următori (ex: "Vrei să-ți recomand ceva din colecția noastră?")

🎯 **OBIECTIVE:**
- Rezolvă problema clientului rapid și complet
- Cross-sell natural: sugerează produse complementare doar când e relevant
- Încurajează acțiuni: "Poți vedea produsul aici: /produs/..." 
- Oferă alternative când un produs nu e disponibil
- Fii proactivă: întreabă preferințe dacă clientul e indecis
${dynamicContext}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-16),
      { role: "user", content: message },
    ];

    // ─── Stream response ───
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        max_tokens: 700,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ reply: "Sistemul este momentan ocupat. Te rog încearcă din nou în câteva secunde. ⏳" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ reply: "Mulțumesc pentru mesaj! Contactează-ne la contact@mamalucica.ro. 📧" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", status, await response.text());
      return new Response(JSON.stringify({ reply: "Mulțumesc! Echipa noastră va reveni cu un răspuns." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update session
    if (sessionId) {
      supabase.from("chatbot_sessions").update({ messages_count: (history?.length || 0) + 2 }).eq("id", sessionId).then(() => {});
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ reply: "Ne cerem scuze, a apărut o eroare. Te rog încearcă din nou sau contactează-ne la contact@mamalucica.ro 🙏" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
