import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductRow {
  name: string;
  slug?: string;
  price: number;
  old_price?: number | null;
  stock?: number;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  brand_name?: string | null;
  brand_id?: string | null;
  category_id?: string | null;
  specs?: Record<string, unknown> | null;
  featured?: boolean;
  sku?: string | null;
  ean?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  tags?: string[] | null;
  warranty_months?: number | null;
  status?: string | null;
  weight_kg?: number | null;
  cost_price?: number | null;
  low_stock_threshold?: number | null;
  visible?: boolean;
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function cleanProduct(item: Record<string, any>): ProductRow | null {
  const name = item.name || item.title || item.nume || item.titlu;
  const price = parseFloat(item.price || item.pret || item["preț"] || "0");
  if (!name || isNaN(price) || price <= 0) return null;

  return {
    name,
    slug: item.slug || slugify(name),
    price,
    old_price: parseFloat(item.old_price || item.compare_at_price || item.pret_vechi) || null,
    stock: parseInt(item.stock || item.stoc || item.cantitate || "0") || 0,
    description: item.description || item.descriere || null,
    short_description: item.short_description || null,
    image_url: item.image_url || item.image || item.imagine || null,
    images: Array.isArray(item.images) ? item.images : null,
    brand_name: item.brand || item.marca || item.producator || null,
    category_id: item.category_id || null,
    specs: item.specs || item.specificatii || null,
    featured: item.featured === true || item.featured === "true" || item.featured === "1",
    sku: item.sku || item.cod || null,
    ean: item.ean || item.gtin || null,
    meta_title: item.meta_title || null,
    meta_description: item.meta_description || null,
    canonical_url: item.canonical_url || null,
    tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : null),
    warranty_months: parseInt(item.warranty_months || item.garantie) || null,
    status: item.status || null,
    weight_kg: parseFloat(item.weight_kg || item.weight) || null,
    cost_price: parseFloat(item.cost_price) || null,
    low_stock_threshold: parseInt(item.low_stock_threshold) || null,
    visible: item.visible === false || item.visible === "false" || item.visible === "0" ? false : undefined,
  };
}

function parseCSV(text: string): ProductRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const products: ProductRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else current += char;
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
    const product = cleanProduct(row);
    if (product) products.push(product);
  }
  return products;
}

function parseJSONFeed(data: unknown): ProductRow[] {
  let items: unknown[] = [];
  if (Array.isArray(data)) items = data;
  else if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.products)) items = obj.products;
    else if (Array.isArray(obj.items)) items = obj.items;
    else if (Array.isArray(obj.data)) items = obj.data;
    else items = [data];
  }
  return items.map((item: any) => cleanProduct(item)).filter(Boolean) as ProductRow[];
}

function parseXMLFeed(text: string): ProductRow[] {
  const products: ProductRow[] = [];
  const productRegex = /<(?:product|produs|item)[^>]*>([\s\S]*?)<\/(?:product|produs|item)>/gi;
  let match;
  while ((match = productRegex.exec(text)) !== null) {
    const block = match[1];
    const getVal = (tags: string[]): string => {
      for (const tag of tags) {
        const m = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
        if (m) return (m[1] || m[2] || "").trim();
      }
      return "";
    };
    const row: Record<string, string> = {
      name: getVal(["name", "title", "nume", "titlu"]),
      price: getVal(["price", "pret"]),
      old_price: getVal(["old_price", "pret_vechi", "compare_at_price"]),
      stock: getVal(["stock", "stoc"]),
      description: getVal(["description", "descriere"]),
      image_url: getVal(["image_url", "image", "imagine", "image_link"]),
      brand_name: getVal(["brand", "marca"]),
      slug: getVal(["slug"]),
      category_id: getVal(["category_id"]),
      sku: getVal(["sku", "cod"]),
      ean: getVal(["ean", "gtin"]),
      featured: getVal(["featured"]),
    };
    const product = cleanProduct(row);
    if (product) products.push(product);
  }
  return products;
}

function applyPriceTransform(price: number, mode: string, multiplier: number, margin: number): number {
  switch (mode) {
    case 'multiply': return Math.round(price * multiplier * 100) / 100;
    case 'add_margin': return Math.round((price + margin) * 100) / 100;
    default: return price;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== serviceKey) {
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const userClient = createClient(supabaseUrl, anonKey);
        const { data: { user } } = await userClient.auth.getUser(token);
        if (!user) {
          return new Response(JSON.stringify({ error: "Neautorizat" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        userId = user.id;
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        if (!roleData) {
          return new Response(JSON.stringify({ error: "Acces interzis" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    let products: ProductRow[] = [];
    let source = "unknown";
    let importMode = "create_and_update"; // create_only, update_only, create_and_update
    let priceMode = "as_is";
    let priceMultiplier = 1.0;
    let priceMargin = 0;
    let stockOnlySync = false;
    let fileName: string | null = null;
    let scheduledImportId: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "Niciun fișier trimis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await file.text();
      products = parseCSV(text);
      source = "csv";
    } else {
      const body = await req.json();
      importMode = body.import_mode || "create_and_update";
      priceMode = body.price_mode || "as_is";
      priceMultiplier = parseFloat(body.price_multiplier) || 1.0;
      priceMargin = parseFloat(body.price_margin) || 0;
      stockOnlySync = body.stock_only_sync === true;
      fileName = body.file_name || null;
      scheduledImportId = body.scheduled_import_id || null;

      if (body.feed_url) {
        const feedRes = await fetch(body.feed_url);
        if (!feedRes.ok) {
          return new Response(JSON.stringify({ error: `Eroare la feed URL: ${feedRes.status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const feedContentType = feedRes.headers.get("content-type") || "";
        const feedText = await feedRes.text();
        if (feedContentType.includes("json") || feedText.trim().startsWith("[") || feedText.trim().startsWith("{")) {
          products = parseJSONFeed(JSON.parse(feedText));
          source = "json_feed";
        } else if (feedContentType.includes("xml") || feedText.trim().startsWith("<")) {
          products = parseXMLFeed(feedText);
          source = "xml_feed";
        } else if (feedText.includes(",")) {
          products = parseCSV(feedText);
          source = "csv_feed";
        }
      } else if (body.products) {
        products = parseJSONFeed(body.products);
        source = "api";
      } else if (Array.isArray(body)) {
        products = parseJSONFeed(body);
        source = "api";
      }
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "Niciun produs valid găsit", source }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Apply price transforms
    if (priceMode !== 'as_is') {
      products = products.map(p => ({
        ...p,
        price: applyPriceTransform(p.price, priceMode, priceMultiplier, priceMargin),
      }));
    }

    // Resolve brand names to brand IDs
    const brandNames = [...new Set(products.map(p => p.brand_name).filter(Boolean))] as string[];
    const brandIdMap: Record<string, string> = {};
    if (brandNames.length > 0) {
      for (const name of brandNames) {
        const brandSlug = slugify(name);
        const { data: existing } = await supabase.from("brands").select("id").eq("slug", brandSlug).maybeSingle();
        if (existing) brandIdMap[name.toLowerCase()] = existing.id;
        else {
          const { data: inserted } = await supabase.from("brands").insert({ name, slug: brandSlug }).select("id").single();
          if (inserted) brandIdMap[name.toLowerCase()] = inserted.id;
        }
      }
    }

    // Build upsert records
    const toProcess = products.map((p, idx) => {
      const clean: Record<string, any> = { name: p.name, slug: p.slug || slugify(p.name), price: p.price };
      if (!stockOnlySync) {
        if (p.old_price != null) clean.old_price = p.old_price;
        if (p.description != null) clean.description = p.description;
        if (p.short_description != null) clean.short_description = p.short_description;
        if (p.image_url != null) clean.image_url = p.image_url;
        if (p.images != null) clean.images = p.images;
        if (p.brand_name) {
          const resolvedId = brandIdMap[p.brand_name.toLowerCase()];
          if (resolvedId) clean.brand_id = resolvedId;
        } else if (p.brand_id) clean.brand_id = p.brand_id;
        if (p.category_id != null) clean.category_id = p.category_id;
        if (p.specs != null) clean.specs = p.specs;
        if (p.featured) clean.featured = true;
        if (p.meta_title != null) clean.meta_title = p.meta_title;
        if (p.meta_description != null) clean.meta_description = p.meta_description;
        if (p.canonical_url != null) clean.canonical_url = p.canonical_url;
        if (p.tags != null) clean.tags = p.tags;
        if (p.warranty_months != null) clean.warranty_months = p.warranty_months;
        if (p.status != null) clean.status = p.status;
        if (p.weight_kg != null) clean.weight_kg = p.weight_kg;
        if (p.cost_price != null) clean.cost_price = p.cost_price;
        if (p.low_stock_threshold != null) clean.low_stock_threshold = p.low_stock_threshold;
        if (p.visible === false) clean.visible = false;
      }
      if (p.stock != null) clean.stock = p.stock;
      if (p.sku != null) clean.sku = p.sku;
      if (p.ean != null) clean.ean = p.ean;
      return { clean, row: idx + 2 }; // row 2+ for CSV (header=row1)
    });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: { row: number; message: string }[] = [];

    if (importMode === 'update_only') {
      // Only update existing products matched by SKU
      for (const item of toProcess) {
        const sku = item.clean.sku;
        if (!sku) { skippedCount++; continue; }
        const { data: existing } = await supabase.from("products").select("id").eq("sku", sku).maybeSingle();
        if (!existing) { skippedCount++; continue; }
        const updateData = { ...item.clean };
        delete updateData.slug; // don't change slug on update
        const { error } = await supabase.from("products").update(updateData).eq("id", existing.id);
        if (error) { errorCount++; errors.push({ row: item.row, message: error.message }); }
        else updatedCount++;
      }
    } else if (importMode === 'create_only') {
      // Only create new products, skip existing (match by slug)
      const batchSize = 50;
      const items = toProcess.map(i => i.clean);
      // Check existing slugs
      const slugs = items.map(i => i.slug);
      const { data: existingSlugs } = await supabase.from("products").select("slug").in("slug", slugs);
      const existingSlugSet = new Set((existingSlugs || []).map((e: any) => e.slug));
      
      const toInsert = [];
      for (let i = 0; i < items.length; i++) {
        if (existingSlugSet.has(items[i].slug)) { skippedCount++; }
        else toInsert.push({ item: items[i], row: toProcess[i].row });
      }

      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize).map(t => t.item);
        const { data, error } = await supabase.from("products").insert(batch).select("id");
        if (error) {
          errorCount += batch.length;
          errors.push({ row: toInsert[i].row, message: error.message });
        } else createdCount += data.length;
      }
    } else {
      // create_and_update: upsert on slug
      const batchSize = 50;
      const items = toProcess.map(i => i.clean);
      
      // Check which exist for accurate counting
      const slugs = items.map(i => i.slug);
      const { data: existingSlugs } = await supabase.from("products").select("slug").in("slug", slugs);
      const existingSlugSet = new Set((existingSlugs || []).map((e: any) => e.slug));

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const { data, error } = await supabase.from("products").upsert(batch, { onConflict: "slug" }).select("id");
        if (error) {
          errorCount += batch.length;
          errors.push({ row: toProcess[i].row, message: error.message });
        } else {
          for (let j = 0; j < batch.length; j++) {
            if (existingSlugSet.has(batch[j].slug)) updatedCount++;
            else createdCount++;
          }
        }
      }
    }

    // Log import history
    await supabase.from("import_history").insert({
      source,
      file_name: fileName,
      total_rows: products.length,
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      error_count: errorCount,
      errors: errors.slice(0, 100), // cap at 100 errors
      import_mode: importMode,
      scheduled_import_id: scheduledImportId,
      user_id: userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        source,
        total_parsed: products.length,
        inserted: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
        error_details: errors.slice(0, 50),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Eroare necunoscută" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
