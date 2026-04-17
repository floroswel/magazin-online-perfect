import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface AdminNotif {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotif[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data as AdminNotif[]);
    };
    fetchRecent();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const n = payload.new as AdminNotif;
          setNotifications((prev) => [n, ...prev.slice(0, 19)]);
          toast.info(n.title, { description: n.message || undefined });
        }
      )
      .subscribe();

    // Also subscribe to orders for auto-creating notifications
    const orderChannel = supabase
      .channel("admin-orders-notif")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const o = payload.new as any;
          await supabase.from("admin_notifications").insert({
            type: "order",
            title: `🛒 Comandă nouă #${(o.id || "").slice(0, 8)}`,
            message: `${o.user_email || "Client"} — ${Number(o.total).toLocaleString("ro-RO")} RON`,
            link: "/admin/orders",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "returns" },
        async (payload) => {
          const r = payload.new as any;
          await supabase.from("admin_notifications").insert({
            type: "return",
            title: "📦 Cerere retur nouă",
            message: `Retur pentru comanda #${(r.order_id || "").slice(0, 8)}`,
            link: "/admin/orders/returns",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews" },
        async (payload) => {
          const rv = payload.new as any;
          await supabase.from("admin_notifications").insert({
            type: "review",
            title: "⭐ Review nou",
            message: `Rating: ${rv.rating}/5`,
            link: "/admin/products/reviews",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("admin_notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = (notif: AdminNotif) => {
    if (!notif.is_read) markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const typeEmoji: Record<string, string> = {
    order: "🛒",
    return: "📦",
    review: "⭐",
    stock: "📉",
    customer: "👤",
    payment: "💳",
    info: "ℹ️",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notificări</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="w-3 h-3" /> Marchează citite
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nicio notificare</p>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                    <div className={!notif.is_read ? "" : "pl-4"}>
                      <p className="text-sm font-medium">
                        {typeEmoji[notif.type] || "📌"} {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ro })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
