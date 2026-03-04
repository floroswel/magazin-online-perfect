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
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  tags?: string[] | null;
  warranty_months?: number | null;
  status?: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanProduct(item: Record<string, any>): ProductRow | null {
  const name = item.name || item.title || item.nume || item.titlu;
  const price = parseFloat(item.price || item.pret || item["preț"] || "0");
  if (!name || isNaN(price) || price <= 0) return null;

  return {
    name,
    slug: item.slug || slugify(name),
    price,
    old_price: parseFloat(item.old_price || item.pret_vechi) || null,
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
    meta_title: item.meta_title || null,
    meta_description: item.meta_description || null,
    canonical_url: item.canonical_url || null,
    tags: Array.isArray(item.tags) ? item.tags : null,
    warranty_months: parseInt(item.warranty_months || item.garantie) || null,
    status: item.status || null,
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
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const product = cleanProduct(row);
    if (product) products.push(product);
  }

  return products;
}

function parseJSONFeed(data: unknown): ProductRow[] {
  let items: unknown[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.products)) items = obj.products;
    else if (Array.isArray(obj.items)) items = obj.items;
    else if (Array.isArray(obj.data)) items = obj.data;
    else items = [data];
  }

  return items
    .map((item: any) => cleanProduct(item))
    .filter(Boolean) as ProductRow[];
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
      old_price: getVal(["old_price", "pret_vechi"]),
      stock: getVal(["stock", "stoc"]),
      description: getVal(["description", "descriere"]),
      image_url: getVal(["image_url", "image", "imagine", "image_link"]),
      brand_name: getVal(["brand", "marca"]),
      slug: getVal(["slug"]),
      category_id: getVal(["category_id"]),
      sku: getVal(["sku", "cod"]),
      featured: getVal(["featured"]),
    };

    const product = cleanProduct(row);
    if (product) products.push(product);
  }

  return products;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin via auth header
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== serviceKey) {
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const userClient = createClient(supabaseUrl, anonKey);
        const { data: { user } } = await userClient.auth.getUser(token);
        
        if (!user) {
          return new Response(JSON.stringify({ error: "Neautorizat" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          return new Response(JSON.stringify({ error: "Acces interzis" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    let products: ProductRow[] = [];
    let source = "unknown";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "Niciun fișier trimis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await file.text();
      products = parseCSV(text);
      source = "csv";
    } else {
      const body = await req.json();

      if (body.feed_url) {
        const feedRes = await fetch(body.feed_url);
        if (!feedRes.ok) {
          return new Response(JSON.stringify({ error: `Eroare la feed URL: ${feedRes.status}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
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
      return new Response(JSON.stringify({ error: "Niciun produs valid găsit", source }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean nulls from each product before upsert
    const toUpsert = products.map((p) => {
      const clean: Record<string, any> = { name: p.name, slug: p.slug || slugify(p.name), price: p.price };
      if (p.old_price != null) clean.old_price = p.old_price;
      if (p.stock != null) clean.stock = p.stock;
      if (p.description != null) clean.description = p.description;
      if (p.short_description != null) clean.short_description = p.short_description;
      if (p.image_url != null) clean.image_url = p.image_url;
      if (p.images != null) clean.images = p.images;
      if (p.brand != null) clean.brand = p.brand;
      if (p.category_id != null) clean.category_id = p.category_id;
      if (p.specs != null) clean.specs = p.specs;
      if (p.featured) clean.featured = true;
      if (p.sku != null) clean.sku = p.sku;
      if (p.meta_title != null) clean.meta_title = p.meta_title;
      if (p.meta_description != null) clean.meta_description = p.meta_description;
      if (p.canonical_url != null) clean.canonical_url = p.canonical_url;
      if (p.tags != null) clean.tags = p.tags;
      if (p.warranty_months != null) clean.warranty_months = p.warranty_months;
      if (p.status != null) clean.status = p.status;
      return clean;
    });

    // Batch upsert
    const batchSize = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < toUpsert.length; i += batchSize) {
      const batch = toUpsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("products")
        .upsert(batch, { onConflict: "slug" })
        .select("id");
      if (error) {
        console.error("Batch upsert error:", error);
        errors += batch.length;
      } else {
        inserted += data.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, source, total_parsed: products.length, inserted, errors }),
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
