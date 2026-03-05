import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all dynamic groups
    const { data: groups } = await supabase
      .from("customer_groups")
      .select("*")
      .eq("type", "dynamic");

    if (!groups || groups.length === 0) {
      return new Response(JSON.stringify({ message: "No dynamic groups" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get all profiles
    const { data: profiles } = await supabase.from("profiles").select("user_id, abc_class, created_at");
    if (!profiles) {
      return new Response(JSON.stringify({ message: "No profiles" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get all orders aggregated by user
    const { data: orders } = await supabase.from("orders").select("user_id, total, created_at");
    const userStats = new Map<string, { count: number; total: number; lastOrder: string | null }>();
    (orders || []).forEach((o: any) => {
      const s = userStats.get(o.user_id) || { count: 0, total: 0, lastOrder: null };
      s.count++;
      s.total += Number(o.total);
      if (!s.lastOrder || o.created_at > s.lastOrder) s.lastOrder = o.created_at;
      userStats.set(o.user_id, s);
    });

    let totalUpdated = 0;

    for (const group of groups) {
      const rules = Array.isArray(group.rules) ? group.rules : [];
      if (rules.length === 0) continue;

      const matchingUserIds: string[] = [];

      for (const profile of profiles) {
        const stats = userStats.get(profile.user_id) || { count: 0, total: 0, lastOrder: null };
        let matches = true;

        for (const rule of rules) {
          const val = Number(rule.value) || 0;
          const now = Date.now();

          switch (rule.field) {
            case "total_spent_gt":
              if (stats.total <= val) matches = false; break;
            case "total_spent_lt":
              if (stats.total >= val) matches = false; break;
            case "order_count_gt":
              if (stats.count <= val) matches = false; break;
            case "order_count_lt":
              if (stats.count >= val) matches = false; break;
            case "last_order_days_lt":
              if (!stats.lastOrder || (now - new Date(stats.lastOrder).getTime()) > val * 86400000) matches = false; break;
            case "last_order_days_gt":
              if (!stats.lastOrder || (now - new Date(stats.lastOrder).getTime()) < val * 86400000) matches = false; break;
            case "registered_days_lt":
              if ((now - new Date(profile.created_at).getTime()) > val * 86400000) matches = false; break;
            case "abc_class":
              if (profile.abc_class !== rule.value) matches = false; break;
            default:
              break;
          }
          if (!matches) break;
        }

        if (matches) matchingUserIds.push(profile.user_id);
      }

      // Remove old members for this dynamic group
      await supabase.from("customer_group_members").delete().eq("group_id", group.id);

      // Insert new members
      if (matchingUserIds.length > 0) {
        const rows = matchingUserIds.map(uid => ({ group_id: group.id, user_id: uid }));
        // Insert in batches of 500
        for (let i = 0; i < rows.length; i += 500) {
          await supabase.from("customer_group_members").insert(rows.slice(i, i + 500));
        }
      }

      // Update group metadata
      await supabase.from("customer_groups").update({
        last_sync_at: new Date().toISOString(),
        member_count: matchingUserIds.length,
      }).eq("id", group.id);

      totalUpdated++;
    }

    return new Response(JSON.stringify({ success: true, groupsProcessed: totalUpdated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
