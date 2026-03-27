import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── TYPES ────────────────────────────────────────────────
interface Notification {
  id: string;
  type: "purchase" | "review" | "visitors" | "stock" | "custom";
  name?: string;
  city?: string;
  product_name?: string;
  product_image?: string;
  time_ago?: string;
  rating?: number;
  count?: number;
  stock?: number;
  message?: string;
  icon?: string;
  link_url?: string;
}

interface Settings {
  enabled: boolean;
  show_on_pages: string[];
  initial_delay_sec: number;
  display_duration_sec: number;
  interval_between_sec: number;
  cooldown_after_close_min: number;
  max_per_session: number;
  position: string;
  show_mobile: boolean;
  show_desktop: boolean;
  purchases_enabled: boolean;
  purchases_source: string;
  purchases_days_back: number;
  name_format: string;
  purchases_template: string;
  show_product_image: boolean;
  show_time_ago: boolean;
  reviews_enabled: boolean;
  reviews_min_stars: number;
  reviews_days_back: number;
  reviews_template: string;
  visitors_enabled: boolean;
  visitors_mode: string;
  visitors_simulated_count: number;
  visitors_min_to_show: number;
  visitors_global_template: string;
  visitors_product_template: string;
  stock_enabled: boolean;
  stock_threshold: number;
  stock_template: string;
  stock_product_page_only: boolean;
  card_bg_color: string;
  text_color: string;
  accent_color: string;
  border_radius_px: number;
  font_size_px: number;
  shadow_intensity: number;
  animation_style: string;
}

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  show_on_pages: ["all"],
  initial_delay_sec: 5,
  display_duration_sec: 6,
  interval_between_sec: 4,
  cooldown_after_close_min: 5,
  max_per_session: 8,
  position: "bottom-left",
  show_mobile: true,
  show_desktop: true,
  purchases_enabled: true,
  purchases_source: "real",
  purchases_days_back: 30,
  name_format: "name_city",
  purchases_template: "{name} a cumpărat {product}",
  show_product_image: true,
  show_time_ago: true,
  reviews_enabled: false,
  reviews_min_stars: 5,
  reviews_days_back: 60,
  reviews_template: "{name} a lăsat ⭐⭐⭐⭐⭐ pentru {product}",
  visitors_enabled: false,
  visitors_mode: "simulated",
  visitors_simulated_count: 15,
  visitors_min_to_show: 3,
  visitors_global_template: "👀 {count} persoane în magazin acum",
  visitors_product_template: "🔥 {count} persoane se uită la acest produs acum",
  stock_enabled: false,
  stock_threshold: 5,
  stock_template: "⚠️ Doar {stock} bucăți rămase din {product}",
  stock_product_page_only: true,
  card_bg_color: "",
  text_color: "",
  accent_color: "",
  border_radius_px: 12,
  font_size_px: 13,
  shadow_intensity: 2,
  animation_style: "slide-left",
};

function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "chiar acum";
  if (minutes < 60) return `acum ${minutes} minute`;
  if (minutes < 120) return "acum 1 oră";
  if (minutes < 1440) return `acum ${Math.floor(minutes / 60)} ore`;
  if (minutes < 2880) return "ieri";
  return `acum ${Math.floor(minutes / 1440)} zile`;
}

function getPageType(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/product/")) return "product";
  if (pathname === "/catalog" || pathname.startsWith("/catalog")) return "category";
  if (pathname === "/cart") return "cart";
  if (pathname.startsWith("/checkout")) return "checkout";
  if (pathname.startsWith("/order-confirmation")) return "confirmation";
  if (pathname === "/personalizare") return "personalizare";
  return "other";
}

function formatName(firstName: string | null, city: string | null, format: string): string {
  const name = firstName || "Un client";
  switch (format) {
    case "name_city": return city ? `${name} din ${city}` : name;
    case "name_initial": return name;
    case "name_only": return name;
    case "anonymous": return "Un client";
    default: return name;
  }
}

// Session storage for dedup
const SESSION_KEY = "sp_shown";
const SESSION_COUNT_KEY = "sp_count";
const SESSION_COOLDOWN_KEY = "sp_cooldown";

function getShownIds(): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]")); } catch { return new Set(); }
}
function addShownId(id: string) {
  const set = getShownIds(); set.add(id);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
}
function getSessionCount(): number {
  return parseInt(sessionStorage.getItem(SESSION_COUNT_KEY) || "0", 10);
}
function incrementSessionCount() {
  sessionStorage.setItem(SESSION_COUNT_KEY, String(getSessionCount() + 1));
}
function setCooldownUntil(min: number) {
  sessionStorage.setItem(SESSION_COOLDOWN_KEY, String(Date.now() + min * 60000));
}
function isInCooldown(): boolean {
  const until = parseInt(sessionStorage.getItem(SESSION_COOLDOWN_KEY) || "0", 10);
  return Date.now() < until;
}

export default function SocialProofPopup() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [queue, setQueue] = useState<Notification[]>([]);
  const [current, setCurrent] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const queueIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setTimeout>>();
  const startedRef = useRef(false);

  // Load settings
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "social_proof_settings")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          setSettings({ ...DEFAULT_SETTINGS, ...(data.value_json as any) });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      });
  }, []);

  // Load notification queue
  useEffect(() => {
    if (!settings || !settings.enabled) return;

    const loadQueue = async () => {
      const notifications: Notification[] = [];

      // Purchase notifications
      if (settings.purchases_enabled) {
        if (settings.purchases_source === "real" || settings.purchases_source === "mixed") {
          const { data: orders } = await supabase
            .from("social_proof_events")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(30);

          if (orders) {
            orders.forEach((o: any) => {
              const name = formatName(o.buyer_first_name, o.buyer_city, settings.name_format);
              notifications.push({
                id: `purchase-${o.id}`,
                type: "purchase",
                name,
                product_name: o.product_name,
                product_image: o.product_image,
                time_ago: formatTimeAgo(new Date(o.created_at)),
              });
            });
          }
        }

        if (settings.purchases_source === "simulated" || settings.purchases_source === "mixed") {
          const { data: simulated } = await supabase
            .from("social_proof_simulated")
            .select("*")
            .eq("active", true)
            .eq("type", "purchase")
            .order("sort_order");

          if (simulated) {
            simulated.forEach((s: any) => {
              const name = formatName(s.first_name, s.city, settings.name_format);
              notifications.push({
                id: `sim-${s.id}`,
                type: "purchase",
                name,
                product_name: s.product_name,
                product_image: s.product_image,
                time_ago: s.time_display,
              });
            });
          }
        }
      }

      // Review notifications
      if (settings.reviews_enabled) {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("id, rating, comment, customer_name, created_at, products(name, image_url)")
          .gte("rating", settings.reviews_min_stars)
          .order("created_at", { ascending: false })
          .limit(20);

        if (reviews) {
          reviews.forEach((r: any) => {
            const firstName = r.customer_name?.split(" ")[0] || "Un client";
            notifications.push({
              id: `review-${r.id}`,
              type: "review",
              name: firstName,
              product_name: r.products?.name,
              product_image: r.products?.image_url,
              rating: r.rating,
              time_ago: formatTimeAgo(new Date(r.created_at)),
            });
          });
        }
      }

      // Visitors notification
      if (settings.visitors_enabled) {
        const count = settings.visitors_mode === "simulated"
          ? settings.visitors_simulated_count
          : Math.max(settings.visitors_min_to_show, Math.floor(Math.random() * 30) + 5);

        if (count >= settings.visitors_min_to_show) {
          notifications.push({
            id: `visitors-global`,
            type: "visitors",
            count,
            message: settings.visitors_global_template.replace("{count}", String(count)),
            icon: "👀",
          });
        }
      }

      // Custom messages
      const { data: customMsgs } = await supabase
        .from("social_proof_custom_messages")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      if (customMsgs) {
        customMsgs.forEach((m: any) => {
          notifications.push({
            id: `custom-${m.id}`,
            type: "custom",
            message: m.message_text,
            icon: m.icon_value,
            link_url: m.link_url,
          });
        });
      }

      // Shuffle for variety
      for (let i = notifications.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [notifications[i], notifications[j]] = [notifications[j], notifications[i]];
      }

      setQueue(notifications);
    };

    loadQueue();
  }, [settings]);

  // Show next notification
  const showNext = useCallback(() => {
    if (!settings || !settings.enabled) return;
    if (isInCooldown()) return;
    if (getSessionCount() >= settings.max_per_session) return;

    const shown = getShownIds();
    const available = queue.filter(n => !shown.has(n.id));
    if (available.length === 0) return;

    const idx = queueIndexRef.current % available.length;
    const notification = available[idx];
    queueIndexRef.current = idx + 1;

    addShownId(notification.id);
    incrementSessionCount();
    setCurrent(notification);
    setVisible(true);

    // Track analytics
    supabase.from("social_proof_analytics").insert({
      notification_type: notification.type,
      page_url: window.location.pathname,
      session_id: sessionStorage.getItem("sp_session") || crypto.randomUUID(),
    }).then(() => {});

    // Auto dismiss
    timerRef.current = setTimeout(() => {
      if (!hovered) {
        setVisible(false);
      }
    }, settings.display_duration_sec * 1000);
  }, [settings, queue, hovered]);

  // Start the notification cycle
  useEffect(() => {
    if (!settings || !settings.enabled || queue.length === 0 || startedRef.current) return;

    // Check page eligibility
    const pageType = getPageType(location.pathname);
    if (pageType === "checkout") return; // Never on checkout
    if (!settings.show_on_pages.includes("all") && !settings.show_on_pages.includes(pageType)) return;

    // Check device
    if (isMobile && !settings.show_mobile) return;
    if (!isMobile && !settings.show_desktop) return;

    startedRef.current = true;

    // Initial delay then show
    timerRef.current = setTimeout(() => {
      showNext();
      intervalRef.current = setInterval(() => {
        if (!isInCooldown()) showNext();
      }, (settings.display_duration_sec + settings.interval_between_sec) * 1000);
    }, settings.initial_delay_sec * 1000);

    return () => {
      startedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings, queue, location.pathname, isMobile, showNext]);

  // Reset started ref on navigation
  useEffect(() => {
    startedRef.current = false;
  }, [location.pathname]);

  // Handle dismiss after hover
  useEffect(() => {
    if (!hovered && visible && current) {
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [hovered, visible, current]);

  const handleClose = () => {
    setVisible(false);
    if (settings) setCooldownUntil(settings.cooldown_after_close_min);

    // Track dismiss
    supabase.from("social_proof_analytics").insert({
      notification_type: current?.type || "unknown",
      was_dismissed: true,
      page_url: window.location.pathname,
      session_id: sessionStorage.getItem("sp_session") || "",
    }).then(() => {});
  };

  const handleClick = () => {
    // Track click
    supabase.from("social_proof_analytics").insert({
      notification_type: current?.type || "unknown",
      was_clicked: true,
      page_url: window.location.pathname,
      session_id: sessionStorage.getItem("sp_session") || "",
    }).then(() => {});

    if (current?.link_url) {
      window.location.href = current.link_url;
    }
  };

  if (!settings || !settings.enabled || !current) return null;

  // Position classes
  const posMap: Record<string, string> = {
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-20 left-4",
    "top-right": "top-20 right-4",
  };

  const mobileBottomOffset = isMobile ? "pb-safe" : "";
  const posClass = posMap[settings.position] || posMap["bottom-left"];

  // Animation classes
  const animMap: Record<string, { enter: string; exit: string }> = {
    "slide-left": {
      enter: "animate-[slideInLeft_300ms_ease-out_forwards]",
      exit: "animate-[slideOutLeft_250ms_ease-in_forwards]",
    },
    "fade": {
      enter: "animate-fade-in",
      exit: "animate-fade-out",
    },
    "bounce": {
      enter: "animate-[bounceIn_400ms_ease-out_forwards]",
      exit: "animate-fade-out",
    },
    "scale": {
      enter: "animate-scale-in",
      exit: "animate-scale-out",
    },
  };

  const anim = animMap[settings.animation_style] || animMap["slide-left"];

  // Build card content
  const renderContent = () => {
    switch (current.type) {
      case "purchase":
        return (
          <div className="flex gap-3 items-center">
            {settings.show_product_image && (
              current.product_image ? (
                <img src={current.product_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
              )
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-tight truncate">{current.name}</p>
              <p className="opacity-70 text-xs truncate">
                {settings.purchases_template
                  .replace("{name}", "")
                  .replace("{product}", current.product_name || "")
                  .replace("{city}", current.city || "")
                  .replace("{time_ago}", current.time_ago || "")
                  .trim()}
              </p>
              {settings.show_time_ago && current.time_ago && (
                <p className="text-xs mt-0.5" style={{ color: settings.accent_color || undefined }}>
                  ⏰ {current.time_ago}
                </p>
              )}
            </div>
          </div>
        );

      case "review":
        return (
          <div className="flex gap-3 items-center">
            {settings.show_product_image && current.product_image ? (
              <img src={current.product_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-tight truncate">{current.name}</p>
              <p className="opacity-70 text-xs truncate">
                a lăsat {"⭐".repeat(current.rating || 5)} pentru {current.product_name}
              </p>
              {settings.show_time_ago && current.time_ago && (
                <p className="text-xs mt-0.5 opacity-50">{current.time_ago}</p>
              )}
            </div>
          </div>
        );

      case "visitors":
        return (
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-2xl">
              {current.icon || "👀"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-tight">{current.message}</p>
            </div>
          </div>
        );

      case "stock":
        return (
          <div className="flex gap-3 items-center">
            {current.product_image ? (
              <img src={current.product_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 text-2xl">⚠️</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-tight text-destructive">
                {settings.stock_template
                  .replace("{stock}", String(current.stock || 0))
                  .replace("{product}", current.product_name || "")}
              </p>
            </div>
          </div>
        );

      case "custom":
        return (
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-2xl">
              {current.icon || "🎁"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-tight">{current.message}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Ensure session id
  if (!sessionStorage.getItem("sp_session")) {
    sessionStorage.setItem("sp_session", crypto.randomUUID());
  }

  return (
    <div
      className={cn(
        "fixed z-[9000] transition-all",
        posClass,
        visible ? anim.enter : `${anim.exit} pointer-events-none`,
        isMobile && "!bottom-[max(80px,env(safe-area-inset-bottom))] !left-4"
      )}
      style={{
        maxWidth: isMobile ? 320 : 360,
        opacity: visible ? 1 : 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={current?.link_url ? handleClick : undefined}
      role={current?.link_url ? "button" : undefined}
    >
      <div
        className="relative p-3"
        style={{
          background: settings.card_bg_color || "hsl(var(--card))",
          color: settings.text_color || "hsl(var(--card-foreground))",
          borderRadius: `${settings.border_radius_px}px`,
          borderLeft: `3px solid ${settings.accent_color || "hsl(var(--primary))"}`,
          fontSize: `${settings.font_size_px}px`,
          boxShadow: `0 ${settings.shadow_intensity * 2}px ${settings.shadow_intensity * 8}px rgba(0,0,0,${settings.shadow_intensity * 0.04 + 0.04})`,
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors opacity-60 hover:opacity-100"
          aria-label="Închide"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
}
