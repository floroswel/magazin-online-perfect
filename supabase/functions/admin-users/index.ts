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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Neautorizat" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
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

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "50");

    // List all auth users via admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    // Get all roles
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Get all profiles
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone, avatar_url");

    const rolesMap = new Map<string, string[]>();
    allRoles?.forEach((r) => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    });

    const profilesMap = new Map(
      allProfiles?.map((p) => [p.user_id, p]) || []
    );

    const enrichedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      full_name: profilesMap.get(u.id)?.full_name || u.user_metadata?.full_name || null,
      phone: profilesMap.get(u.id)?.phone || null,
      avatar_url: profilesMap.get(u.id)?.avatar_url || null,
      roles: rolesMap.get(u.id) || [],
    }));

    return new Response(
      JSON.stringify({ users: enrichedUsers, total: enrichedUsers.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Admin users error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Eroare" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
