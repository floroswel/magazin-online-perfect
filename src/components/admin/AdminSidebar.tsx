import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart,
  BarChart3, ArrowLeft, Store, X, ChevronDown, Warehouse, Users,
  Megaphone, FileText, Globe, CreditCard, Truck, Settings, Shield,
  Puzzle, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          { label: "Comenzi noi", path: "/admin/orders/new" },
          { label: "În procesare", path: "/admin/orders/processing" },
          { label: "În livrare", path: "/admin/orders/shipping" },
          { label: "Livrate", path: "/admin/orders/delivered" },
          { label: "Anulate", path: "/admin/orders/cancelled" },
          { label: "Comenzi marketplace", path: "/admin/orders/marketplace" },
          { label: "Comenzi B2B", path: "/admin/orders/b2b" },
          { label: "Comenzi recurente", path: "/admin/orders/recurring" },
          { label: "Comenzi cu probleme", path: "/admin/orders/issues" },
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
          { label: "Seturi de atribute", path: "/admin/products/attribute-sets" },
          { label: "Specificații tehnice", path: "/admin/products/specs" },
          { label: "Produse în promoție", path: "/admin/products/promo" },
          { label: "Produse fără imagine", path: "/admin/products/no-image" },
          { label: "Produse fără descriere", path: "/admin/products/no-description" },
          { label: "Review-uri", path: "/admin/products/reviews" },
          { label: "Întrebări produse", path: "/admin/products/questions" },
          { label: "Produse similare", path: "/admin/products/related" },
          { label: "Compatibilități", path: "/admin/products/compatibility" },
          { label: "Import/Export", path: "/admin/products/import-export" },
          { label: "Actualizare în masă", path: "/admin/products/bulk-update" },
          { label: "SEO produse", path: "/admin/products/seo" },
        ],
      },
      {
        label: "Stoc & Depozit", icon: Warehouse,
        children: [
          { label: "Stocuri", path: "/admin/stock" },
          { label: "Depozite", path: "/admin/stock/warehouses" },
          { label: "Transferuri stoc", path: "/admin/stock/transfers" },
          { label: "Mișcări stoc", path: "/admin/stock/movements" },
          { label: "Ajustări stoc", path: "/admin/stock/adjustments" },
          { label: "Inventar", path: "/admin/stock/inventory" },
          { label: "NIR (Recepție)", path: "/admin/stock/nir" },
          { label: "Seriale / IMEI", path: "/admin/stock/serials" },
          { label: "Loturi", path: "/admin/stock/batches" },
          { label: "Expirări", path: "/admin/stock/expiry" },
          { label: "Picking list", path: "/admin/stock/picking" },
          { label: "Alerte stoc", path: "/admin/stock/alerts" },
          { label: "Furnizori", path: "/admin/stock/suppliers" },
          { label: "Aprovizionare", path: "/admin/stock/reorder" },
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
          { label: "Toți clienții", path: "/admin/customers" },
          { label: "Clienți noi", path: "/admin/customers/new" },
          { label: "Clienți activi", path: "/admin/customers/active" },
          { label: "Clienți inactivi", path: "/admin/customers/inactive" },
          { label: "Clienți VIP", path: "/admin/customers/vip" },
          { label: "Clienți B2B", path: "/admin/customers/b2b" },
          { label: "Grupuri clienți", path: "/admin/customers/groups" },
          { label: "Segmentare", path: "/admin/customers/segments" },
          { label: "Etichete (tag-uri)", path: "/admin/customers/tags" },
          { label: "Puncte fidelitate", path: "/admin/customers/loyalty" },
          { label: "Blacklist", path: "/admin/customers/blacklist" },
          { label: "Tichete suport", path: "/admin/customers/tickets" },
          { label: "GDPR & date", path: "/admin/customers/gdpr" },
          { label: "Import clienți", path: "/admin/customers/import" },
          { label: "Export clienți", path: "/admin/customers/export" },
        ],
      },
      {
        label: "Marketing", icon: Megaphone,
        children: [
          { label: "Cupoane & reduceri", path: "/admin/coupons" },
          { label: "Promoții", path: "/admin/marketing/promotions" },
          { label: "Campanii email", path: "/admin/newsletter" },
          { label: "Campanii SMS", path: "/admin/marketing/sms" },
          { label: "Coș abandonat", path: "/admin/marketing/abandoned-cart" },
          { label: "Automatizări", path: "/admin/marketing/automations" },
          { label: "Bannere & popups", path: "/admin/marketing/banners" },
          { label: "Upsell / Cross-sell", path: "/admin/marketing/upsell" },
          { label: "Feed-uri marketing", path: "/admin/marketing/feeds" },
          { label: "Pixel tracking", path: "/admin/marketing/pixels" },
          { label: "Program afiliere", path: "/admin/marketing/affiliates" },
          { label: "Recomandări", path: "/admin/marketing/recommendations" },
          { label: "Teste A/B", path: "/admin/marketing/ab-tests" },
          { label: "Rapoarte marketing", path: "/admin/marketing/reports" },
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
          { label: "Page Builder", path: "/admin/content/page-builder" },
          { label: "Homepage", path: "/admin/content/homepage" },
          { label: "Landing pages", path: "/admin/content/landing" },
          { label: "Blog", path: "/admin/content/blog" },
          { label: "Media library", path: "/admin/content/media" },
          { label: "Meniu & navigație", path: "/admin/content/menus" },
          { label: "Scripturi custom", path: "/admin/content/scripts" },
          { label: "Traduceri", path: "/admin/content/translations" },
          { label: "Șabloane email", path: "/admin/content/email-templates" },
          { label: "SEO & redirecționări", path: "/admin/content/seo" },
          { label: "Termeni & politici", path: "/admin/content/legal" },
        ],
      },
      {
        label: "Multi-canal", icon: Globe,
        children: [
          { label: "eMAG Marketplace", path: "/admin/channels/emag" },
          { label: "Google Shopping", path: "/admin/channels/google" },
          { label: "Facebook Shop", path: "/admin/channels/facebook" },
          { label: "Allegro", path: "/admin/channels/allegro" },
          { label: "OLX", path: "/admin/channels/olx" },
          { label: "Price.ro", path: "/admin/channels/pricero" },
          { label: "Compari.ro", path: "/admin/channels/compariro" },
          { label: "API extern", path: "/admin/channels/api" },
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
          { label: "Gateway-uri", path: "/admin/payments/gateways" },
          { label: "Tranzacții", path: "/admin/payments/transactions" },
          { label: "Refund-uri", path: "/admin/payments/refunds" },
          { label: "Rate & Installments", path: "/admin/payments/installments" },
          { label: "Mokka (Config)", path: "/admin/payments/mokka" },
          { label: "Decontări", path: "/admin/payments/settlements" },
          { label: "Reconciliere", path: "/admin/payments/reconciliation" },
        ],
      },
      {
        label: "Livrare / Curieri", icon: Truck,
        children: [
          { label: "Curieri", path: "/admin/shipping/carriers" },
          { label: "Tarife transport", path: "/admin/shipping/rates" },
          { label: "AWB automat", path: "/admin/shipping/awb" },
          { label: "Etichete", path: "/admin/shipping/labels" },
          { label: "Tracking", path: "/admin/shipping/tracking" },
          { label: "Lockere / Easybox", path: "/admin/shipping/lockers" },
          { label: "Livrări internaționale", path: "/admin/shipping/international" },
          { label: "Puncte ridicare", path: "/admin/shipping/pickup" },
          { label: "Programări livrare", path: "/admin/shipping/scheduling" },
          { label: "Webhooks", path: "/admin/shipping/webhooks" },
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
          { label: "Produse lente", path: "/admin/reports/slow-movers" },
          { label: "Clienți", path: "/admin/reports/customers" },
          { label: "Stoc & rotație", path: "/admin/reports/inventory" },
          { label: "Conversie / funnel", path: "/admin/reports/conversion" },
          { label: "Marketing ROI", path: "/admin/reports/marketing" },
          { label: "Financiar", path: "/admin/reports/financial" },
          { label: "Rapoarte custom", path: "/admin/reports/custom" },
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
          { label: "Taxe (TVA)", path: "/admin/settings/taxes" },
          { label: "Magazin", path: "/admin/settings/store" },
          { label: "Coș de cumpărături", path: "/admin/settings/cart" },
          { label: "Checkout", path: "/admin/settings/checkout" },
          { label: "Email / SMTP", path: "/admin/settings/email" },
          { label: "SEO global", path: "/admin/settings/seo" },
          { label: "Notificări", path: "/admin/settings/notifications" },
          { label: "Securitate", path: "/admin/settings/security" },
          { label: "GDPR & politici", path: "/admin/settings/gdpr" },
          { label: "Integrări", path: "/admin/settings/integrations" },
        ],
      },
      {
        label: "Utilizatori & Roluri", icon: Shield,
        children: [
          { label: "Utilizatori", path: "/admin/users" },
          { label: "Roluri & permisiuni", path: "/admin/users/roles" },
          { label: "Sesiuni active", path: "/admin/users/sessions" },
          { label: "2FA", path: "/admin/users/2fa" },
          { label: "IP whitelist", path: "/admin/users/ip-whitelist" },
          { label: "Audit log", path: "/admin/users/audit" },
        ],
      },
      {
        label: "Module", icon: Puzzle,
        children: [
          { label: "Module instalate", path: "/admin/modules" },
          { label: "Marketplace", path: "/admin/modules/marketplace" },
          { label: "Generator AI", path: "/admin/modules/ai-generator" },
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({ open, onClose, collapsed = false, onToggleCollapse }: AdminSidebarProps) {
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

  const isParentActiveForItem = (item: MenuItem) =>
    item.children?.some((c) => isActive(c.path)) ?? false;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "admin-sidebar min-h-screen bg-[hsl(222,47%,16%)] border-r border-[hsl(222,30%,24%)] flex flex-col shrink-0 transition-all duration-200",
          "fixed lg:static z-50 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-[210px]",
          collapsed && "lg:w-[56px]"
        )}
      >
        {/* Brand */}
        <div className="px-2.5 py-2 border-b border-[hsl(222,30%,24%)] flex items-center justify-between shrink-0">
          <Link to="/admin" className="flex items-center gap-1.5 overflow-hidden" onClick={handleNavClick}>
            <div className="w-7 h-7 rounded bg-[hsl(210,100%,65%)]/20 border border-[hsl(210,100%,65%)]/30 flex items-center justify-center shrink-0">
              <Store className="w-3.5 h-3.5 text-[hsl(210,100%,65%)]" />
            </div>
            {!collapsed && (
              <div className="hidden lg:block">
                <h2 className="font-bold text-xs leading-tight text-white">MegaShop</h2>
                <p className="text-[9px] text-[hsl(210,15%,60%)] font-medium leading-none">ADMIN</p>
              </div>
            )}
            <div className="lg:hidden">
              <h2 className="font-bold text-xs leading-tight text-white">MegaShop</h2>
              <p className="text-[9px] text-[hsl(210,15%,60%)] font-medium leading-none">ADMIN</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-0.5 rounded hover:bg-white/10 text-[hsl(210,15%,60%)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-1.5 space-y-px">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {section.title && !collapsed && (
                  <p className="px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[hsl(210,100%,65%)]/60">
                    {section.title}
                  </p>
                )}
                {section.title && collapsed && (
                  <div className="hidden lg:block mx-2 my-2 border-t border-[hsl(210,100%,65%)]/15" />
                )}
                {section.items.map((item) => {
                  const isExpanded = expandedMenus.includes(item.label);
                  const hasChildren = !!item.children;
                  const isParentActive = hasChildren && isParentActiveForItem(item);

                  if (collapsed && !hasChildren) {
                    return (
                      <Tooltip key={item.label}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.path!}
                            onClick={handleNavClick}
                            className={cn(
                              "hidden lg:flex items-center justify-center w-full h-9 rounded transition-all duration-100",
                              isActive(item.path!)
                                ? "bg-[hsl(210,100%,65%)]/15 text-[hsl(210,100%,75%)] border border-[hsl(210,100%,65%)]/25"
                                : "text-[hsl(210,15%,70%)] hover:text-white hover:bg-white/5"
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  if (collapsed && hasChildren) {
                    return (
                      <Tooltip key={item.label}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onToggleCollapse?.()}
                            className={cn(
                              "hidden lg:flex items-center justify-center w-full h-9 rounded transition-all duration-100",
                              isParentActive
                                ? "text-[hsl(210,100%,75%)] bg-[hsl(210,100%,65%)]/10"
                                : "text-[hsl(210,15%,70%)] hover:text-white hover:bg-white/5"
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

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
                            : "text-[hsl(210,15%,70%)] hover:text-white hover:bg-white/5",
                          collapsed && "lg:hidden"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label} className={cn(collapsed && "lg:hidden")}>
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
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-1.5 border-t border-[hsl(222,30%,24%)] shrink-0 space-y-0.5">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center gap-1.5 w-full px-2 py-1 rounded text-[11px] text-[hsl(210,15%,60%)] hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            ) : (
              <>
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>Restrânge</span>
              </>
            )}
          </button>
          <Link
            to="/"
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-[hsl(210,15%,60%)] hover:text-white hover:bg-white/5 transition-colors",
              collapsed ? "lg:justify-center" : ""
            )}
          >
            <ArrowLeft className="w-3 h-3" />
            {!collapsed && <span className="hidden lg:inline">Magazin</span>}
            <span className="lg:hidden">Magazin</span>
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
}
