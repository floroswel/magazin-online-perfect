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
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
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
        ],
      },
      {
        label: "Produse", icon: Package,
        children: [
          { label: "Toate produsele", path: "/admin/products" },
          { label: "Categorii", path: "/admin/categories" },
          { label: "Mărci", path: "/admin/products/brands" },
          { label: "Atribute & variante", path: "/admin/products/attributes" },
          { label: "Review-uri", path: "/admin/products/reviews" },
          { label: "Import/Export", path: "/admin/products/import-export" },
          { label: "SEO produse", path: "/admin/products/seo" },
        ],
      },
      {
        label: "Stoc & Depozit", icon: Warehouse,
        children: [
          { label: "Stocuri", path: "/admin/stock" },
          { label: "Mișcări stoc", path: "/admin/stock/movements" },
          { label: "Alerte stoc", path: "/admin/stock/alerts" },
          { label: "Inventar", path: "/admin/stock/inventory" },
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
          { label: "Segmentare", path: "/admin/customers/segments" },
        ],
      },
      {
        label: "Marketing", icon: Megaphone,
        children: [
          { label: "Cupoane & reduceri", path: "/admin/coupons" },
          { label: "Promoții", path: "/admin/marketing/promotions" },
          { label: "Campanii email", path: "/admin/newsletter" },
          { label: "Automatizări", path: "/admin/marketing/automations" },
          { label: "Bannere & popups", path: "/admin/marketing/banners" },
          { label: "Upsell / Cross-sell", path: "/admin/marketing/upsell" },
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
          { label: "Media library", path: "/admin/content/media" },
          { label: "Meniu & navigație", path: "/admin/content/menus" },
          { label: "Șabloane email", path: "/admin/content/email-templates" },
        ],
      },
      {
        label: "Multi-canal", icon: Globe,
        children: [
          { label: "eMAG Marketplace", path: "/admin/channels/emag" },
          { label: "Google Shopping", path: "/admin/channels/google" },
          { label: "Facebook Shop", path: "/admin/channels/facebook" },
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
          { label: "SEO global", path: "/admin/settings/seo" },
          { label: "Notificări", path: "/admin/settings/notifications" },
          { label: "GDPR & politici", path: "/admin/settings/gdpr" },
          { label: "Integrări", path: "/admin/settings/integrations" },
        ],
      },
      {
        label: "Utilizatori & Roluri", icon: Shield,
        children: [
          { label: "Utilizatori", path: "/admin/users" },
          { label: "Roluri & permisiuni", path: "/admin/users/roles" },
          { label: "Audit log", path: "/admin/users/audit" },
        ],
      },
      {
        label: "Module", icon: Puzzle,
        children: [
          { label: "Module instalate", path: "/admin/modules" },
          { label: "Marketplace", path: "/admin/modules/marketplace" },
          { label: "Logs & health", path: "/admin/modules/logs" },
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

  const handleNavClick = () => onClose?.();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={cn(
          "w-[260px] min-h-screen bg-card border-r border-border flex flex-col shrink-0 transition-transform duration-200",
          "fixed lg:static z-50 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <Link to="/admin" className="flex items-center gap-2.5" onClick={handleNavClick}>
            <div className="w-9 h-9 rounded-lg bg-primary/20 cyber-border-glow border flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight text-foreground cyber-text-glow">MegaShop</h2>
              <p className="text-[11px] text-muted-foreground font-mono-cyber">ADMIN PANEL</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {section.title && (
                  <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-primary/60 font-mono-cyber">
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
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isActive(item.path!)
                            ? "bg-primary/15 text-primary cyber-glow border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isParentActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                        <div className="ml-4 pl-3 border-l border-primary/20 space-y-0.5 mt-0.5 mb-1">
                          {item.children!.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={handleNavClick}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-150",
                                isActive(child.path)
                                  ? "text-primary font-medium bg-primary/10 border-l-2 border-primary -ml-[1px] pl-[9px]"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
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

        {/* Footer */}
        <div className="p-2 border-t border-border shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Înapoi la magazin
          </Link>
        </div>
      </aside>
    </>
  );
}
