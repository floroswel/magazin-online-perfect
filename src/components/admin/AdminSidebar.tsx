import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart,
  BarChart3, ArrowLeft, Store, X, ChevronDown, Warehouse, Users,
  Megaphone, FileText, Globe, CreditCard, Truck, Settings, Shield,
  Puzzle, PanelLeftClose, PanelLeftOpen, Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          { label: "🎨 Statusuri comenzi", path: "/admin/orders/statuses" },
        ],
      },
      {
        label: "Produse", icon: Package,
        children: [
          { label: "Toate produsele", path: "/admin/products" },
          { label: "Categorii", path: "/admin/categories" },
          { label: "Categorii smart", path: "/admin/categories/smart" },
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
          { label: "📦 Pachete (Bundles)", path: "/admin/products/bundles" },
        ],
      },
      {
        label: "Stoc & Depozit", icon: Warehouse,
        children: [
          { label: "Stocuri", path: "/admin/stock" },
          { label: "📋 Manager stocuri", path: "/admin/stock/manager" },
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
          { label: "💰 Liste de Prețuri", path: "/admin/stock/price-lists" },
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
          { label: "Coșuri abandonate", path: "/admin/customers/abandoned" },
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
          { label: "Reguli de preț", path: "/admin/marketing/pricing-rules" },
          { label: "Campanii email", path: "/admin/newsletter" },
          { label: "Campanii SMS", path: "/admin/marketing/sms" },
          { label: "Coș abandonat", path: "/admin/customers/abandoned" },
          { label: "Automatizări", path: "/admin/marketing/automations" },
          { label: "Bannere & popups", path: "/admin/marketing/banners" },
          { label: "Upsell / Cross-sell", path: "/admin/marketing/upsell" },
          { label: "Feed-uri marketing", path: "/admin/marketing/feeds" },
          { label: "Pixel tracking", path: "/admin/marketing/pixels" },
          { label: "Program afiliere", path: "/admin/marketing/affiliates" },
          { label: "🎁 Carduri cadou", path: "/admin/marketing/gift-cards" },
          { label: "🤝 Recomandări", path: "/admin/marketing/referrals" },
          { label: "📦 Pachete & Kit-uri", path: "/admin/marketing/bundles" },
          { label: "🔔 Back in Stock", path: "/admin/marketing/back-in-stock" },
          { label: "💰 Alerte de preț", path: "/admin/marketing/price-alerts" },
          { label: "👁️ Social Proof", path: "/admin/marketing/social-proof" },
          { label: "💬 Live Chat & AI", path: "/admin/marketing/live-chat" },
          { label: "📦 Cutii abonament", path: "/admin/marketing/subscription-boxes" },
          { label: "Recomandări produse", path: "/admin/marketing/recommendations" },
          { label: "Teste A/B", path: "/admin/marketing/ab-tests" },
          { label: "Rapoarte marketing", path: "/admin/marketing/reports" },
          { label: "📊 Integrări marketing", path: "/admin/marketing/integrations" },
          { label: "🤖 Cartbot (AI Coș)", path: "/admin/marketing/cartbot" },
          { label: "🎯 Retargetare & Win-Back", path: "/admin/marketing/retargeting" },
        ],
      },
    ],
  },
  {
    title: "CONȚINUT",
    items: [
      {
        label: "Conținut & Pagini", icon: FileText,
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
    ],
  },
  {
    title: "OPERAȚIUNI",
    items: [
      {
        label: "Plăți", icon: CreditCard,
        children: [
          { label: "Metode de plată", path: "/admin/payments/methods" },
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
    title: "INTEGRĂRI",
    items: [
      {
        label: "Integrări", icon: Plug,
        children: [
          { label: "Toate integrările", path: "/admin/integrations" },
          { label: "App Store", path: "/admin/integrations/app-store" },
          { label: "Stripe", path: "/admin/integrations/stripe" },
          { label: "PayPal", path: "/admin/integrations/paypal" },
          { label: "Netopia", path: "/admin/integrations/netopia" },
          { label: "euPlătesc", path: "/admin/integrations/euplatesc" },
          { label: "Plăți Online", path: "/admin/integrations/plati-online" },
          { label: "TBI Bank", path: "/admin/integrations/tbi-bank" },
          { label: "PayPo", path: "/admin/integrations/paypo" },
          { label: "LeanPay", path: "/admin/integrations/leanpay" },
          { label: "Banca Transilvania", path: "/admin/integrations/banca-transilvania" },
          { label: "SmartBuyBT", path: "/admin/integrations/smartbuybt" },
          { label: "ePay", path: "/admin/integrations/epay" },
          { label: "Revolut", path: "/admin/integrations/revolut" },
          { label: "Fan Courier", path: "/admin/integrations/fan-courier" },
          { label: "Sameday", path: "/admin/integrations/sameday" },
          { label: "GLS", path: "/admin/integrations/gls" },
          { label: "Cargus", path: "/admin/integrations/cargus" },
          { label: "DPD", path: "/admin/integrations/dpd" },
          { label: "DHL", path: "/admin/integrations/dhl" },
          { label: "SmartBill", path: "/admin/settings/smartbill" },
          { label: "Facebook Pixel", path: "/admin/integrations/facebook-pixel" },
          { label: "TikTok Pixel", path: "/admin/integrations/tiktok-pixel" },
          { label: "Google Ads", path: "/admin/integrations/google-ads" },
          { label: "Google Analytics", path: "/admin/integrations/google-analytics" },
          { label: "Google Tag Manager", path: "/admin/integrations/gtm" },
          { label: "Mailchimp", path: "/admin/integrations/mailchimp" },
          { label: "eMAG Marketplace", path: "/admin/integrations/emag" },
          { label: "Google Shopping", path: "/admin/integrations/google-shopping" },
          { label: "Facebook Shop", path: "/admin/integrations/facebook-shop" },
          { label: "Compari.ro", path: "/admin/integrations/compariro" },
          { label: "Price.ro", path: "/admin/integrations/pricero" },
          { label: "Facebook Login", path: "/admin/integrations/facebook-login" },
          { label: "Google Login", path: "/admin/integrations/google-login" },
          { label: "NOD", path: "/admin/integrations/nod" },
          { label: "SSL Certificate", path: "/admin/integrations/ssl" },
          { label: "🔗 Integrări ERP", path: "/admin/integrations/erp" },
        ],
      },
      {
        label: "Multi-canal", icon: Globe,
        children: [
          { label: "Allegro", path: "/admin/channels/allegro" },
          { label: "OLX", path: "/admin/channels/olx" },
          { label: "API extern", path: "/admin/channels/api" },
          { label: "Conectori externi", path: "/admin/channels/connectors" },
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
          { label: "📊 Analitice trafic", path: "/admin/reports/traffic" },
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
          { label: "🎨 Personalizare Temă", path: "/admin/settings/theme" },
          { label: "Taxe (TVA)", path: "/admin/settings/taxes" },
          { label: "Magazin", path: "/admin/settings/store" },
          { label: "Coș de cumpărături", path: "/admin/settings/cart" },
          { label: "Checkout", path: "/admin/settings/checkout" },
          { label: "Email / SMTP", path: "/admin/settings/email" },
          { label: "📧 Șabloane email", path: "/admin/content/email-templates" },
          { label: "📋 Log email-uri", path: "/admin/settings/email-logs" },
          { label: "SEO global", path: "/admin/settings/seo" },
          { label: "Notificări", path: "/admin/settings/notifications" },
          { label: "Securitate", path: "/admin/settings/security" },
          { label: "GDPR & politici", path: "/admin/settings/gdpr" },
          { label: "Retururi", path: "/admin/settings/returns" },
          { label: "Facturare", path: "/admin/settings/invoices" },
          { label: "Badge-uri legale footer", path: "/admin/settings/footer-badges" },
          { label: "Setări footer", path: "/admin/settings/footer" },
          { label: "⚡ Performanță", path: "/admin/settings/performance" },
          { label: "🖥️ POS (Point of Sale)", path: "/admin/settings/pos" },
          { label: "🚚 Dropshipping", path: "/admin/settings/dropshipping" },
          { label: "🌍 Multi-Store & Limbi", path: "/admin/settings/multi-store" },
          { label: "👤 Portal client", path: "/admin/settings/customer-portal" },
          { label: "🏢 Validare CUI/CIF (ANAF)", path: "/admin/settings/cui-validation" },
          { label: "📦 Pachete de Produse", path: "/admin/settings/bundles" },
          { label: "💰 Liste de Prețuri", path: "/admin/settings/price-lists" },
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
        label: "Aplicații", icon: Puzzle,
        children: [
          { label: "🤖 Generator AI", path: "/admin/modules/ai-generator" },
          { label: "⚙️ Setări AI", path: "/admin/modules/ai-generator/settings" },
          { label: "⏳ Aprobări AI", path: "/admin/modules/ai-generator/approvals" },
          { label: "📦 Bulk AI", path: "/admin/modules/ai-generator/bulk" },
          { label: "📊 Utilizare AI", path: "/admin/modules/ai-generator/usage" },
          { label: "Logs & health", path: "/admin/modules/logs" },
        ],
      },
    ],
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({ open, onClose, collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const location = useLocation();
  const { name: storeName } = useStoreBranding();
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
          "admin-sidebar min-h-screen bg-background border-r border-border flex flex-col shrink-0 transition-all duration-200",
          "fixed lg:static z-50 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-[210px]",
          collapsed && "lg:w-[56px]"
        )}
      >
        {/* Brand */}
        <div className="px-2.5 py-2 border-b border-border flex items-center justify-between shrink-0">
          <Link to="/admin" className="flex items-center gap-1.5 overflow-hidden" onClick={handleNavClick}>
            <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Store className="w-3.5 h-3.5 text-primary" />
            </div>
            {!collapsed && (
              <div className="hidden lg:block">
                <h2 className="font-bold text-xs leading-tight text-accent-foreground">{storeName}</h2>
                <p className="text-[9px] text-muted-foreground font-medium leading-none">ADMIN</p>
              </div>
            )}
            <div className="lg:hidden">
              <h2 className="font-bold text-xs leading-tight text-accent-foreground">{storeName}</h2>
              <p className="text-[9px] text-muted-foreground font-medium leading-none">ADMIN</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-0.5 rounded hover:bg-accent-foreground/10 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-1.5 space-y-px">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {section.title && !collapsed && (
                  <p className="px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-primary/60">
                    {section.title}
                  </p>
                )}
                {section.title && collapsed && (
                  <div className="hidden lg:block mx-2 my-2 border-t border-primary/15" />
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
                                ? "bg-primary/15 text-primary-foreground border border-primary/25"
                                : "text-foreground hover:text-accent-foreground hover:bg-accent-foreground/5"
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
                                ? "bg-primary/15 text-primary-foreground border border-primary/25"
                                : "text-foreground hover:text-accent-foreground hover:bg-accent-foreground/5"
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
                          "flex items-center gap-2 px-2 h-8 rounded text-[11px] font-medium transition-all duration-100",
                          isActive(item.path!)
                            ? "bg-primary/15 text-primary-foreground border border-primary/25"
                            : "text-foreground hover:text-accent-foreground hover:bg-accent-foreground/5"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 h-8 rounded text-[11px] font-medium transition-all duration-100",
                          isParentActive
                            ? "text-primary-foreground"
                            : "text-foreground hover:text-accent-foreground hover:bg-accent-foreground/5"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "w-3 h-3 shrink-0 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      {isExpanded && (
                        <div className="ml-3 pl-2 border-l border-border space-y-px mt-0.5">
                          {item.children!.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={handleNavClick}
                              className={cn(
                                "block px-2 py-1 rounded text-[10px] transition-all duration-100",
                                isActive(child.path)
                                  ? "bg-primary/10 text-primary-foreground font-semibold"
                                  : "text-[hsl(var(--sidebar-dim))] hover:text-[hsl(var(--sidebar-hover))] hover:bg-accent-foreground/5"
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
        <div className="p-1.5 border-t border-border space-y-1 shrink-0">
          {!collapsed ? (
            <>
              <Link
                to="/"
                className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] text-[hsl(var(--sidebar-dim))] hover:text-accent-foreground hover:bg-accent-foreground/5 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Înapoi la magazin</span>
              </Link>
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center gap-2 w-full px-2 py-1.5 rounded text-[10px] text-[hsl(var(--sidebar-dim))] hover:text-accent-foreground hover:bg-accent-foreground/5 transition-colors"
              >
                <PanelLeftClose className="w-3 h-3" />
                <span>Restrânge</span>
              </button>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/"
                    className="hidden lg:flex items-center justify-center w-full h-8 rounded text-[hsl(var(--sidebar-dim))] hover:text-accent-foreground hover:bg-accent-foreground/5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Înapoi la magazin</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex items-center justify-center w-full h-8 rounded text-[hsl(var(--sidebar-dim))] hover:text-accent-foreground hover:bg-accent-foreground/5 transition-colors"
                  >
                    <PanelLeftOpen className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Extinde</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
