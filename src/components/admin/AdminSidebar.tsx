import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart,
  BarChart3, ArrowLeft, Store, X, ChevronDown, Warehouse, Users,
  Megaphone, FileText, Globe, CreditCard, Truck, Settings, Shield,
  Puzzle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  children?: { label: string; path: string }[];
}

const menuSections: { title?: string; items: MenuItem[] }[] = [
  {
    items: [
      {
        label: "Dashboard", icon: LayoutDashboard,
        children: [
          { label: "Overview", path: "/admin" },
          { label: "Activitate live", path: "/admin/dashboard/live" },
          { label: "Task-uri & alerte", path: "/admin/dashboard/tasks" },
        ],
      },
    ],
  },
  {
    title: "VÂNZĂRI",
    items: [
      {
        label: "Comenzi", icon: ShoppingCart,
        children: [
          { label: "Toate comenzile", path: "/admin/orders" },
          { label: "Facturi & documente", path: "/admin/orders/invoices" },
          { label: "Retururi (RMA)", path: "/admin/orders/returns" },
          { label: "Coșuri abandonate", path: "/admin/orders/abandoned" },
          { label: "Comenzi rapide", path: "/admin/orders/quick" },
        ],
      },
      {
        label: "Produse", icon: Package,
        children: [
          { label: "Toate produsele", path: "/admin/products" },
          { label: "Categorii", path: "/admin/categories" },
          { label: "Mărci", path: "/admin/products/brands" },
          { label: "Atribute & variante", path: "/admin/products/attributes" },
          { label: "Filtre (UI)", path: "/admin/products/filters" },
          { label: "Import/Export", path: "/admin/products/import-export" },
          { label: "Feed-uri produse", path: "/admin/products/feeds" },
          { label: "Review-uri", path: "/admin/products/reviews" },
          { label: "Produse digitale", path: "/admin/products/digital" },
          { label: "SEO produse", path: "/admin/products/seo" },
        ],
      },
      {
        label: "Stoc & Depozit", icon: Warehouse,
        children: [
          { label: "Stocuri", path: "/admin/stock" },
          { label: "Mișcări stoc", path: "/admin/stock/movements" },
          { label: "Alerte stoc minim", path: "/admin/stock/alerts" },
          { label: "Inventar", path: "/admin/stock/inventory" },
          { label: "Loturi / Serii", path: "/admin/stock/lots" },
        ],
      },
    ],
  },
  {
    title: "CLIENȚI & MARKETING",
    items: [
      {
        label: "Clienți / CRM", icon: Users,
        children: [
          { label: "Clienți", path: "/admin/customers" },
          { label: "Grupuri clienți", path: "/admin/customers/groups" },
          { label: "Puncte fidelitate", path: "/admin/customers/loyalty" },
          { label: "Tichete suport", path: "/admin/customers/tickets" },
          { label: "Calendar (follow-up)", path: "/admin/customers/calendar" },
          { label: "Segmentare", path: "/admin/customers/segments" },
        ],
      },
      {
        label: "Marketing", icon: Megaphone,
        children: [
          { label: "Cupoane & reduceri", path: "/admin/coupons" },
          { label: "Prețuri speciale", path: "/admin/marketing/pricing" },
          { label: "Promoții în coș", path: "/admin/marketing/promotions" },
          { label: "Upsell / Cross-sell", path: "/admin/marketing/upsell" },
          { label: "Campanii email", path: "/admin/newsletter" },
          { label: "Bannere & popups", path: "/admin/marketing/banners" },
          { label: "Automatizări", path: "/admin/marketing/automations" },
          { label: "Afiliere", path: "/admin/marketing/affiliates" },
        ],
      },
    ],
  },
  {
    title: "CONȚINUT & CANALE",
    items: [
      {
        label: "Conținut", icon: FileText,
        children: [
          { label: "Pagini (CMS)", path: "/admin/content/pages" },
          { label: "Blog", path: "/admin/content/blog" },
          { label: "Meniu & navigație", path: "/admin/content/menus" },
          { label: "Bannere / landing pages", path: "/admin/content/landing" },
          { label: "Media library", path: "/admin/content/media" },
          { label: "Șabloane email", path: "/admin/content/email-templates" },
        ],
      },
      {
        label: "Multi-canal", icon: Globe,
        children: [
          { label: "eMAG Marketplace", path: "/admin/channels/emag" },
          { label: "Google Shopping", path: "/admin/channels/google" },
          { label: "Facebook / Instagram", path: "/admin/channels/facebook" },
          { label: "TikTok Shop", path: "/admin/channels/tiktok" },
          { label: "Comparatoare", path: "/admin/channels/comparators" },
          { label: "EasySales / BaseLinker", path: "/admin/channels/aggregators" },
          { label: "Conectori externi", path: "/admin/channels/connectors" },
        ],
      },
    ],
  },
  {
    title: "OPERAȚIUNI",
    items: [
      {
        label: "Plăți", icon: CreditCard,
        children: [
          { label: "Metode de plată", path: "/admin/payments/methods" },
          { label: "Rate & Installments", path: "/admin/payments/installments" },
          { label: "Stripe / PayPal", path: "/admin/payments/stripe" },
          { label: "Setări plăți", path: "/admin/payments/settings" },
          { label: "Status mapping", path: "/admin/payments/status" },
          { label: "Reconciliere", path: "/admin/payments/reconciliation" },
        ],
      },
      {
        label: "Livrare / Curieri", icon: Truck,
        children: [
          { label: "Curieri", path: "/admin/shipping/carriers" },
          { label: "Tarife transport", path: "/admin/shipping/rates" },
          { label: "AWB automat", path: "/admin/shipping/awb" },
          { label: "Tracking", path: "/admin/shipping/tracking" },
          { label: "Reguli livrare", path: "/admin/shipping/rules" },
          { label: "Puncte ridicare", path: "/admin/shipping/pickup" },
        ],
      },
    ],
  },
  {
    title: "ANALIZĂ",
    items: [
      {
        label: "Rapoarte", icon: BarChart3,
        children: [
          { label: "Vânzări", path: "/admin/reports" },
          { label: "Profit & costuri", path: "/admin/reports/profit" },
          { label: "Produse top", path: "/admin/reports/top-products" },
          { label: "Conversie / funnel", path: "/admin/reports/conversion" },
          { label: "Marketing ROI", path: "/admin/reports/marketing" },
          { label: "Stoc (rotire)", path: "/admin/reports/stock" },
          { label: "Export rapoarte", path: "/admin/reports/export" },
        ],
      },
    ],
  },
  {
    title: "SISTEM",
    items: [
      {
        label: "Setări", icon: Settings,
        children: [
          { label: "General", path: "/admin/settings/general" },
          { label: "Domenii", path: "/admin/settings/domains" },
          { label: "SEO global", path: "/admin/settings/seo" },
          { label: "Notificări", path: "/admin/settings/notifications" },
          { label: "GDPR & confidențialitate", path: "/admin/settings/gdpr" },
          { label: "Politici (T&C, Retur)", path: "/admin/settings/policies" },
          { label: "Integrări", path: "/admin/settings/integrations" },
        ],
      },
      {
        label: "Utilizatori & Roluri", icon: Shield,
        children: [
          { label: "Utilizatori", path: "/admin/users" },
          { label: "Roluri & permisiuni", path: "/admin/users/roles" },
          { label: "Audit log", path: "/admin/users/audit" },
          { label: "2FA admin", path: "/admin/users/2fa" },
        ],
      },
      {
        label: "Module / App Store", icon: Puzzle,
        children: [
          { label: "Module instalate", path: "/admin/modules" },
          { label: "Marketplace", path: "/admin/modules/marketplace" },
          { label: "Status sănătate", path: "/admin/modules/health" },
          { label: "Logs & retry queue", path: "/admin/modules/logs" },
        ],
      },
    ],
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const expanded: string[] = [];
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/"))) {
          expanded.push(item.label);
        }
        if (item.path && location.pathname === item.path) {
          expanded.push(item.label);
        }
      });
    });
    return expanded;
  });

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "w-[260px] min-h-screen bg-card border-r flex flex-col shrink-0 transition-transform duration-200",
          "fixed lg:static z-50 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={handleNavClick}>
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">MegaShop</h2>
              <p className="text-[11px] text-muted-foreground">Panou Admin</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {section.title && (
                  <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const isExpanded = expandedMenus.includes(item.label);
                  const hasChildren = !!item.children;
                  const isParentActive = hasChildren && item.children!.some((c) => isActive(c.path));

                  if (!hasChildren) {
                    return (
                      <Link
                        key={item.label}
                        to={item.path!}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive(item.path!)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isParentActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 shrink-0 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      {isExpanded && (
                        <div className="ml-4 pl-3 border-l border-border/50 space-y-0.5 mt-0.5 mb-1">
                          {item.children!.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={handleNavClick}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                                isActive(child.path)
                                  ? "text-primary font-medium bg-primary/5"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-2 border-t shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Înapoi la magazin
          </Link>
        </div>
      </aside>
    </>
  );
}
