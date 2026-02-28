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

interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  children?: { label: string; path: string }[];
}

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
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "admin-sidebar w-[210px] min-h-screen bg-[hsl(222,47%,16%)] border-r border-[hsl(222,30%,24%)] flex flex-col shrink-0 transition-transform duration-200",
          "fixed lg:static z-50 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand — navy header */}
        <div className="px-2.5 py-2 border-b border-[hsl(222,30%,24%)] flex items-center justify-between shrink-0">
          <Link to="/admin" className="flex items-center gap-1.5" onClick={handleNavClick}>
            <div className="w-7 h-7 rounded bg-[hsl(210,100%,65%)]/20 border border-[hsl(210,100%,65%)]/30 flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-[hsl(210,100%,65%)]" />
            </div>
            <div>
              <h2 className="font-bold text-xs leading-tight text-white">MegaShop</h2>
              <p className="text-[9px] text-[hsl(210,15%,60%)] font-medium leading-none">ADMIN</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-0.5 rounded hover:bg-white/10 text-[hsl(210,15%,60%)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav — ultra compact, navy theme */}
        <ScrollArea className="flex-1">
          <nav className="p-1.5 space-y-px">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {section.title && (
                  <p className="px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[hsl(210,100%,65%)]/60">
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
                          "flex items-center gap-2 px-2 py-1 rounded text-xs font-medium transition-all duration-100",
                          isActive(item.path!)
                            ? "bg-[hsl(210,100%,65%)]/15 text-[hsl(210,100%,75%)] border border-[hsl(210,100%,65%)]/25"
                            : "text-[hsl(210,15%,70%)] hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1 rounded text-xs font-medium transition-all duration-100",
                          isParentActive
                            ? "text-[hsl(210,100%,75%)]"
                            : "text-[hsl(210,15%,70%)] hover:text-white hover:bg-white/5"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "w-3 h-3 shrink-0 transition-transform duration-150",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      {isExpanded && (
                        <div className="ml-3.5 pl-2 border-l border-[hsl(210,100%,65%)]/20 space-y-px mt-px mb-0.5">
                          {item.children!.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={handleNavClick}
                              className={cn(
                                "flex items-center px-1.5 py-[3px] rounded text-[11px] transition-all duration-100 leading-tight",
                                isActive(child.path)
                                  ? "text-white font-medium bg-[hsl(210,100%,65%)]/15 border-l-2 border-[hsl(210,100%,65%)] -ml-px pl-[5px]"
                                  : "text-[hsl(210,15%,60%)] hover:text-white hover:bg-white/5"
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
            ))}</nav>
        </ScrollArea>

        {/* Footer — compact */}
        <div className="p-1.5 border-t border-[hsl(222,30%,24%)] shrink-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-[hsl(210,15%,60%)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Magazin
          </Link>
        </div>
      </aside>
    </>
  );
}
