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
  image_url?: string | null;
  brand?: string | null;
  category_id?: string | null;
  specs?: Record<string, unknown> | null;
  featured?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseCSV(text: string): ProductRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const products: ProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles basic quoted fields)
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

    const name = row["name"] || row["nume"] || row["title"] || row["titlu"];
    const price = parseFloat(row["price"] || row["pret"] || row["preț"] || "0");

    if (!name || isNaN(price) || price <= 0) continue;

    products.push({
      name,
      slug: row["slug"] || slugify(name),
      price,
      old_price: row["old_price"] || row["pret_vechi"] ? parseFloat(row["old_price"] || row["pret_vechi"]) || null : null,
      stock: parseInt(row["stock"] || row["stoc"] || "0") || 0,
      description: row["description"] || row["descriere"] || null,
      image_url: row["image_url"] || row["imagine"] || null,
      brand: row["brand"] || row["marca"] || null,
      category_id: row["category_id"] || null,
      featured: row["featured"] === "true" || row["featured"] === "1",
    });
  }

  return products;
}

function parseJSONFeed(data: unknown): ProductRow[] {
  let items: unknown[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === "object" && data !== null) {
    // Try common feed structures
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.products)) items = obj.products;
    else if (Array.isArray(obj.items)) items = obj.items;
    else if (Array.isArray(obj.data)) items = obj.data;
    else items = [data];
  }

  return items
    .map((item: any) => {
      const name = item.name || item.title || item.nume || item.titlu;
      const price = parseFloat(item.price || item.pret || "0");
      if (!name || isNaN(price) || price <= 0) return null;

      return {
        name,
        slug: item.slug || slugify(name),
        price,
        old_price: item.old_price || item.pret_vechi || null,
        stock: parseInt(item.stock || item.stoc || "0") || 0,
        description: item.description || item.descriere || null,
        image_url: item.image_url || item.image || item.imagine || null,
        brand: item.brand || item.marca || null,
        category_id: item.category_id || null,
        specs: item.specs || item.specificatii || null,
        featured: item.featured === true || item.featured === "1",
      } as ProductRow;
    })
    .filter(Boolean) as ProductRow[];
}

function parseXMLFeed(text: string): ProductRow[] {
  // Simple XML parser for product feeds
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

    const name = getVal(["name", "title", "nume", "titlu"]);
    const price = parseFloat(getVal(["price", "pret"]));
    if (!name || isNaN(price) || price <= 0) continue;

    products.push({
      name,
      slug: getVal(["slug"]) || slugify(name),
      price,
      old_price: parseFloat(getVal(["old_price", "pret_vechi"])) || null,
      stock: parseInt(getVal(["stock", "stoc"])) || 0,
      description: getVal(["description", "descriere"]) || null,
      image_url: getVal(["image_url", "image", "imagine", "image_link"]) || null,
      brand: getVal(["brand", "marca"]) || null,
      category_id: getVal(["category_id"]) || null,
      featured: getVal(["featured"]) === "true",
    });
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

    // Verify admin via auth header (skip for service role key - used by cron)
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      // Allow service role key (used by cron-import)
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

        // Check admin role
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
      // CSV file upload
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
      // JSON body: could be direct products or feed_url
      const body = await req.json();

      if (body.feed_url) {
        // Fetch from external URL
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
        // Direct API: array of products
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

    // Ensure unique slugs
    const existingSlugs = new Set<string>();
    const { data: dbSlugs } = await supabase.from("products").select("slug");
    dbSlugs?.forEach((p) => existingSlugs.add(p.slug));

    const toInsert = products.map((p) => {
      let slug = p.slug || slugify(p.name);
      let counter = 1;
      while (existingSlugs.has(slug)) {
        slug = `${p.slug || slugify(p.name)}-${counter}`;
        counter++;
      }
      existingSlugs.add(slug);
      return { ...p, slug };
    });

    // Batch insert
    const batchSize = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { data, error } = await supabase.from("products").insert(batch).select("id");
      if (error) {
        console.error("Batch insert error:", error);
        errors += batch.length;
      } else {
        inserted += data.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        source,
        total_parsed: products.length,
        inserted,
        errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Eroare necunoscută" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
