import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
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

interface OrderNotification {
  id: string;
  total: number;
  user_email: string | null;
  created_at: string;
  status: string;
  read: boolean;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load recent orders on mount
  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, total, user_email, created_at, status")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(
          data.map((o) => ({ ...o, read: true }))
        );
      }
    };
    fetchRecent();
  }, []);

  // Subscribe to realtime new orders
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as any;
          const notification: OrderNotification = {
            id: newOrder.id,
            total: newOrder.total,
            user_email: newOrder.user_email,
            created_at: newOrder.created_at,
            status: newOrder.status,
            read: false,
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 19)]);

          toast.info("🛒 Comandă nouă!", {
            description: `${newOrder.user_email || "Client"} — ${Number(newOrder.total).toLocaleString("ro-RO")} RON`,
            action: {
              label: "Vezi",
              onClick: () => navigate("/admin/orders"),
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (notif: OrderNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setOpen(false);
    navigate("/admin/orders");
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
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline"
            >
              Marchează citite
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nicio notificare
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                    <div className={!notif.read ? "" : "pl-4"}>
                      <p className="text-sm font-medium">
                        Comandă #{notif.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notif.user_email || "Client"} —{" "}
                        {Number(notif.total).toLocaleString("ro-RO")} RON
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: ro,
                        })}
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
