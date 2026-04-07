import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Megaphone, Trophy,
  FileText, BarChart3, TrendingUp, Palette, Plug, Settings, User,
  ChevronDown, X, ArrowLeft, PanelLeftClose, PanelLeftOpen, LogOut,
  Flame, Webhook, CreditCard, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubItem { label: string; path: string; dividerBefore?: string }
interface MenuItem {
  label: string;
  icon: any;
  path?: string;
  children?: SubItem[];
}
interface MenuSection { title?: string; items: MenuItem[] }

const menuSections: MenuSection[] = [
  {
    title: "PRINCIPAL",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      {
        label: "Comenzi", icon: ShoppingCart,
        children: [
          { label: "Toate Comenzile", path: "/admin/orders" },
          { label: "Comenzi Noi", path: "/admin/orders/new" },
          { label: "Procesare Comenzi", path: "/admin/orders/processing" },
          { label: "În Livrare", path: "/admin/orders/shipping" },
          { label: "Livrate", path: "/admin/orders/delivered" },
          { label: "Anulate", path: "/admin/orders/cancelled" },
          { label: "Marketplace", path: "/admin/orders/marketplace", dividerBefore: "Canale" },
          { label: "Comenzi B2B", path: "/admin/orders/b2b" },
          { label: "Facturi", path: "/admin/orders/invoices", dividerBefore: "Documente" },
          { label: "Coșuri Abandonate", path: "/admin/customers/abandoned" },
          { label: "Retururi", path: "/admin/orders/returns" },
          { label: "Probleme", path: "/admin/orders/issues" },
          { label: "Statusuri", path: "/admin/orders/statuses" },
        ],
      },
      {
        label: "Produse", icon: Package,
        children: [
          { label: "Toate Produsele", path: "/admin/products", dividerBefore: "Catalog" },
          { label: "Categorii", path: "/admin/categories" },
          { label: "Categorii Inteligente", path: "/admin/categories/smart" },
          { label: "Mărci", path: "/admin/products/brands" },
          { label: "Atribute", path: "/admin/products/attributes", dividerBefore: "Detalii Produs" },
          { label: "Seturi Atribute", path: "/admin/products/attribute-sets" },
          { label: "Specificații", path: "/admin/products/specs" },
          { label: "Pachete", path: "/admin/products/bundles" },
          { label: "Linii Produse", path: "/admin/products/lines" },
          { label: "Personalizare", path: "/admin/products/customization" },
          { label: "Produse Relacionate", path: "/admin/products/related", dividerBefore: "Asocieri" },
          { label: "Compatibilitate", path: "/admin/products/compatibility" },
          { label: "Review-uri", path: "/admin/products/reviews", dividerBefore: "Feedback" },
          { label: "Întrebări", path: "/admin/products/questions" },
          { label: "Produse Promoție", path: "/admin/products/promo", dividerBefore: "Control Calitate" },
          { label: "Fără Imagine", path: "/admin/products/no-image" },
          { label: "Fără Descriere", path: "/admin/products/no-description" },
          { label: "SEO Produse", path: "/admin/products/seo", dividerBefore: "Distribuție" },
          { label: "Import / Export", path: "/admin/products/import-export" },
          { label: "Bulk Update", path: "/admin/products/bulk-update" },
          { label: "Feed-uri", path: "/admin/marketing/feeds" },
          { label: "Stoc", path: "/admin/stock", dividerBefore: "Stoc & Logistică" },
          { label: "Manager Stoc", path: "/admin/stock/manager" },
          { label: "Depozite", path: "/admin/stock/warehouses" },
          { label: "Mișcări Stoc", path: "/admin/stock/movements" },
          { label: "Transferuri", path: "/admin/stock/transfers" },
          { label: "Ajustări Stoc", path: "/admin/stock/adjustments" },
          { label: "NIR", path: "/admin/stock/nir" },
          { label: "Alerte Stoc", path: "/admin/stock/alerts" },
          { label: "Inventar", path: "/admin/stock/inventory" },
          { label: "Picking", path: "/admin/stock/picking" },
          { label: "Seriale", path: "/admin/stock/serials", dividerBefore: "Urmărire" },
          { label: "Loturi", path: "/admin/stock/batches" },
          { label: "Expirare", path: "/admin/stock/expiry" },
          { label: "Stoc Predictiv", path: "/admin/stock/predictive", dividerBefore: "Planificare" },
          { label: "Reaprovizionare", path: "/admin/stock/reorder" },
          { label: "Furnizori", path: "/admin/stock/suppliers", dividerBefore: "Furnizori" },
          { label: "Comenzi Furnizori", path: "/admin/stock/purchase-orders" },
          { label: "Liste Prețuri", path: "/admin/stock/price-lists" },
        ],
      },
      {
        label: "CRM", icon: Users,
        children: [
          { label: "Toți Clienții", path: "/admin/customers", dividerBefore: "Clienți" },
          { label: "Clienți Noi", path: "/admin/customers/new" },
          { label: "Clienți Activi", path: "/admin/customers/active" },
          { label: "Clienți Inactivi", path: "/admin/customers/inactive" },
          { label: "Clienți VIP", path: "/admin/customers/vip" },
          { label: "Clienți B2B", path: "/admin/customers/b2b" },
          { label: "Grupuri Clienți", path: "/admin/customers/groups", dividerBefore: "Segmentare" },
          { label: "Segmente", path: "/admin/customers/segments" },
          { label: "Etichete", path: "/admin/customers/tags" },
          { label: "Tichete Support", path: "/admin/customers/tickets", dividerBefore: "Support" },
          { label: "Blacklist", path: "/admin/customers/blacklist" },
          { label: "GDPR", path: "/admin/customers/gdpr", dividerBefore: "Administrare" },
          { label: "Portofel / Sold", path: "/admin/customers/wallet" },
          { label: "Import Clienți", path: "/admin/customers/import" },
          { label: "Export Clienți", path: "/admin/customers/export" },
        ],
      },
    ],
  },
  {
    title: "MARKETING",
    items: [
      {
        label: "Campanii", icon: Trophy,
        children: [
          { label: "Automatizări", path: "/admin/marketing/automations", dividerBefore: "Automatizare" },
          { label: "Cartbot (Reguli Coș)", path: "/admin/marketing/cartbot" },
          { label: "Bannere & Popups", path: "/admin/marketing/banners", dividerBefore: "Vizibilitate" },
          { label: "Upsell / Cross-sell", path: "/admin/marketing/upsell" },
          { label: "Recomandări", path: "/admin/marketing/recommendations" },
          { label: "Social Proof", path: "/admin/marketing/social-proof" },
          { label: "Bundles Marketing", path: "/admin/marketing/bundles" },
          { label: "Retargeting", path: "/admin/marketing/retargeting", dividerBefore: "Campanii" },
          { label: "Teste A/B", path: "/admin/marketing/ab-tests" },
          { label: "SMS Marketing", path: "/admin/marketing/sms" },
          { label: "Newsletter", path: "/admin/newsletter" },
          { label: "Back in Stock", path: "/admin/marketing/back-in-stock" },
          { label: "Alerte Preț", path: "/admin/marketing/price-alerts" },
          { label: "Integrări Marketing", path: "/admin/marketing/integrations", dividerBefore: "Raportare" },
          { label: "Rapoarte Marketing", path: "/admin/marketing/reports" },
        ],
      },
      {
        label: "Marketing", icon: Megaphone,
        children: [
          { label: "Cupoane", path: "/admin/coupons", dividerBefore: "Promoții" },
          { label: "Promoții", path: "/admin/marketing/promotions" },
          { label: "Reguli Prețuri", path: "/admin/marketing/pricing-rules" },
          { label: "Puncte Fidelitate", path: "/admin/customers/loyalty", dividerBefore: "Fidelizare" },
          { label: "Carduri Cadou", path: "/admin/marketing/gift-cards" },
          { label: "Afiliere", path: "/admin/marketing/affiliates" },
          { label: "Referral", path: "/admin/marketing/referrals" },
          { label: "Liste Prețuri", path: "/admin/settings/price-lists", dividerBefore: "Altele" },
          { label: "Live Chat", path: "/admin/marketing/live-chat" },
          { label: "Chatbot AI", path: "/admin/ai/chatbot" },
        ],
      },
    ],
  },
  {
    title: "CONȚINUT",
    items: [
      {
        label: "Conținut", icon: FileText,
        children: [
          { label: "Blog", path: "/admin/content/blog", dividerBefore: "Publicare" },
          { label: "Pagini CMS", path: "/admin/content/pages" },
          { label: "Contact", path: "/admin/settings/contact" },
          { label: "Pagini Legale", path: "/admin/content/legal" },
          { label: "Landing Pages", path: "/admin/content/landing" },
          { label: "Page Builder", path: "/admin/content/page-builder" },
          { label: "Hero Slider", path: "/admin/content/hero-slides", dividerBefore: "Vizual" },
          { label: "Layout Homepage", path: "/admin/content/homepage" },
          { label: "Pagini Statice", path: "/admin/content/static-pages" },
          { label: "Personalizare Conținut", path: "/admin/content/personalization" },
          { label: "Meniuri", path: "/admin/content/menus", dividerBefore: "Navigare & Media" },
          { label: "Media Library", path: "/admin/content/media" },
          { label: "Scripturi Custom", path: "/admin/content/scripts" },
          { label: "Șabloane Email", path: "/admin/content/email-templates", dividerBefore: "Comunicare" },
          { label: "Traduceri", path: "/admin/content/translations" },
          { label: "SEO Conținut", path: "/admin/content/seo" },
        ],
      },
    ],
  },
  {
    title: "ANALIZĂ",
    items: [
      { label: "Insights", icon: TrendingUp, path: "/admin/reports" },
      {
        label: "Rapoarte", icon: BarChart3,
        children: [
          { label: "Profit & Costuri", path: "/admin/reports/profit", dividerBefore: "Financiar" },
          { label: "Rapoarte Financiare", path: "/admin/reports/financial" },
          { label: "Produse Top", path: "/admin/reports/top-products", dividerBefore: "Performanță" },
          { label: "Produse Lente", path: "/admin/reports/slow-movers" },
          { label: "Stoc & Rotație", path: "/admin/reports/inventory" },
          { label: "Clienți", path: "/admin/reports/customers", dividerBefore: "Audiență" },
          { label: "Trafic", path: "/admin/reports/traffic" },
          { label: "Conversie / Funnel", path: "/admin/reports/conversion" },
          { label: "Marketing ROI", path: "/admin/reports/marketing", dividerBefore: "Marketing" },
          { label: "Raport Custom", path: "/admin/reports/custom" },
          { label: "Export Rapoarte", path: "/admin/reports/export" },
        ],
      },
    ],
  },
  {
    title: "SISTEM",
    items: [
      {
        label: "Design", icon: Palette,
        children: [
          { label: "Configurare Temă", path: "/admin/settings/theme", dividerBefore: "Aspect" },
          { label: "Culori & Fonturi", path: "/admin/settings/theme#colors" },
          { label: "Favicon & Logo", path: "/admin/settings/theme#branding" },
          { label: "Editor Conținut Site", path: "/admin/settings/content-editor" },
          { label: "Contact", path: "/admin/settings/contact" },
          { label: "Layout Homepage", path: "/admin/content/homepage", dividerBefore: "Pagini & Secțiuni" },
          { label: "Hero Slider", path: "/admin/content/hero-slides" },
          { label: "Page Builder", path: "/admin/content/page-builder" },
          { label: "Pagini Statice", path: "/admin/content/static-pages" },
          { label: "Landing Pages", path: "/admin/content/landing" },
          { label: "Meniuri", path: "/admin/content/menus", dividerBefore: "Navigare" },
          { label: "Breadcrumbs", path: "/admin/settings/breadcrumbs" },
          { label: "Footer", path: "/admin/settings/footer" },
          { label: "Ticker Bars", path: "/admin/settings/ticker", dividerBefore: "Bannere & Tickere" },
          { label: "Banner Avertisment", path: "/admin/settings/ticker#alert" },
          { label: "Centru Vizibilitate", path: "/admin/control", dividerBefore: "Componente" },
          { label: "Pagină 404", path: "/admin/settings/custom-404" },
          { label: "Slider 360°", path: "/admin/settings/360-slider" },
          { label: "Configurator", path: "/admin/settings/configurator" },
          { label: "Media Library", path: "/admin/content/media" },
          { label: "CSS / Scripturi Custom", path: "/admin/content/scripts" },
        ],
      },
      {
        label: "Integrări", icon: Plug,
        children: [
          { label: "App Store", path: "/admin/integrations/app-store", dividerBefore: "Platformă" },
          { label: "Conectori", path: "/admin/channels/connectors" },
          { label: "API", path: "/admin/channels/api" },
          { label: "ERP", path: "/admin/integrations/erp" },
          { label: "SSL", path: "/admin/integrations/ssl" },
          { label: "eMAG", path: "/admin/integrations/emag", dividerBefore: "Marketplace" },
          { label: "Google Shopping", path: "/admin/integrations/google-shopping" },
          { label: "Facebook Shop", path: "/admin/integrations/facebook-shop" },
          { label: "Compari.ro", path: "/admin/integrations/compariro" },
          { label: "Price.ro", path: "/admin/integrations/pricero" },
          { label: "Allegro", path: "/admin/channels/allegro" },
          { label: "OLX", path: "/admin/channels/olx" },
          { label: "NOD", path: "/admin/integrations/nod" },
          { label: "Fan Courier", path: "/admin/integrations/fan-courier", dividerBefore: "Curieri" },
          { label: "Sameday", path: "/admin/integrations/sameday" },
          { label: "GLS", path: "/admin/integrations/gls" },
          { label: "Cargus", path: "/admin/integrations/cargus" },
          { label: "DPD", path: "/admin/integrations/dpd" },
          { label: "DHL", path: "/admin/integrations/dhl" },
          { label: "Netopia", path: "/admin/integrations/netopia", dividerBefore: "Procesatori Plăți" },
          { label: "euPlătesc", path: "/admin/integrations/euplatesc" },
          { label: "Plăți Online", path: "/admin/integrations/plati-online" },
          { label: "Banca Transilvania", path: "/admin/integrations/banca-transilvania" },
          { label: "SmartBuyBT", path: "/admin/integrations/smartbuybt" },
          { label: "ePay", path: "/admin/integrations/epay" },
          { label: "Revolut", path: "/admin/integrations/revolut" },
          { label: "LeanPay", path: "/admin/integrations/leanpay" },
          { label: "Facebook Pixel", path: "/admin/integrations/facebook-pixel", dividerBefore: "Tracking & Analytics" },
          { label: "TikTok Pixel", path: "/admin/integrations/tiktok-pixel" },
          { label: "Google Ads", path: "/admin/integrations/google-ads" },
          { label: "Google Analytics", path: "/admin/integrations/google-analytics" },
          { label: "Google Tag Manager", path: "/admin/integrations/gtm" },
          { label: "Tracking & Pixeli", path: "/admin/marketing/pixels" },
          { label: "Facturare SmartBill", path: "/admin/settings/smartbill", dividerBefore: "Facturare" },
          { label: "Facebook Login", path: "/admin/integrations/facebook-login", dividerBefore: "Autentificare Socială" },
          { label: "Google Login", path: "/admin/integrations/google-login" },
          { label: "Mailchimp", path: "/admin/integrations/mailchimp", dividerBefore: "Comunicare" },
          { label: "Newsletter / Email", path: "/admin/settings/email" },
          { label: "Loguri Email", path: "/admin/settings/email-logs" },
          { label: "Webhooks Externe", path: "/admin/integrations/external-webhooks" },
        ],
      },
      {
        label: "Plăți", icon: CreditCard,
        children: [
          { label: "Metode de Plată", path: "/admin/payments/methods", dividerBefore: "Configurare" },
          { label: "Transfer Bancar", path: "/admin/payments/bank-transfer" },
          { label: "Rate (Installments)", path: "/admin/payments/installments" },
          { label: "Tranzacții", path: "/admin/payments/transactions", dividerBefore: "Monitorizare" },
          { label: "Rambursări", path: "/admin/payments/refunds" },
          { label: "Reconciliere", path: "/admin/payments/reconciliation" },
          { label: "Decontări", path: "/admin/payments/settlements" },
          { label: "Netopia", path: "/admin/payments/netopia", dividerBefore: "Procesatori" },
          { label: "Mokka", path: "/admin/payments/mokka" },
          { label: "PayPo", path: "/admin/payments/paypo" },
          { label: "TBI Bank", path: "/admin/payments/tbi" },
        ],
      },
      {
        label: "Livrare", icon: Truck,
        children: [
          { label: "Tarife Livrare", path: "/admin/shipping/rates", dividerBefore: "Configurare" },
          { label: "Curieri", path: "/admin/shipping/carriers" },
          { label: "Gomag Shipping", path: "/admin/shipping/gomag" },
          { label: "Generare AWB", path: "/admin/shipping/awb", dividerBefore: "Operațional" },
          { label: "Tracking Colete", path: "/admin/shipping/tracking" },
          { label: "Lockere", path: "/admin/shipping/lockers" },
          { label: "Etichete", path: "/admin/shipping/labels" },
          { label: "Programare Ridicare", path: "/admin/shipping/scheduling" },
          { label: "Puncte Pickup", path: "/admin/shipping/pickup" },
          { label: "Livrare Internațională", path: "/admin/shipping/international", dividerBefore: "Avansat" },
          { label: "Webhooks Livrare", path: "/admin/shipping/webhooks" },
        ],
      },
      {
        label: "AI & Module", icon: Flame,
        children: [
          { label: "AI Generator Hub", path: "/admin/modules/ai-generator", dividerBefore: "Inteligență Artificială" },
          { label: "Setări AI", path: "/admin/modules/ai-generator/settings" },
          { label: "Aprobări Conținut AI", path: "/admin/modules/ai-generator/approvals" },
          { label: "Generare Bulk AI", path: "/admin/modules/ai-generator/bulk" },
          { label: "Utilizare AI", path: "/admin/modules/ai-generator/usage" },
          { label: "Chatbot Asistent", path: "/admin/ai/chatbot", dividerBefore: "Asistență Clienți" },
          { label: "Loguri Sistem", path: "/admin/modules/logs", dividerBefore: "Monitorizare" },
        ],
      },
      {
        label: "Setări", icon: Settings,
        children: [
          { label: "Generale", path: "/admin/settings/general", dividerBefore: "Magazin" },
          { label: "Domenii", path: "/admin/settings/domains" },
          { label: "Abonament", path: "/admin/settings/store" },
          { label: "Checkout", path: "/admin/settings/checkout" },
          { label: "Coș", path: "/admin/settings/cart" },
          { label: "Monedă", path: "/admin/settings/currency" },
          { label: "Retururi", path: "/admin/settings/returns" },
          { label: "Portal Client", path: "/admin/settings/customer-portal" },
          { label: "Validare CUI", path: "/admin/settings/cui-validation" },
          { label: "Facturare", path: "/admin/settings/invoices", dividerBefore: "Plăți & Livrare" },
          { label: "Taxe", path: "/admin/settings/taxes" },
          { label: "Setări Bundles", path: "/admin/settings/bundles", dividerBefore: "Module" },
          { label: "Setări Linii Produse", path: "/admin/settings/product-lines" },
          { label: "Setări Customizare", path: "/admin/settings/customization" },
          { label: "Setări Stock Manager", path: "/admin/settings/stock-manager" },
          { label: "Setări Wallet", path: "/admin/settings/wallet" },
          { label: "SEO & Analytics", path: "/admin/settings/seo", dividerBefore: "Tehnic" },
          { label: "Securitate", path: "/admin/settings/security" },
          { label: "Confidențialitate", path: "/admin/settings/gdpr" },
          { label: "Notificări", path: "/admin/settings/notifications" },
          { label: "Performanță", path: "/admin/settings/performance" },
          { label: "Traduceri", path: "/admin/content/translations", dividerBefore: "Conținut" },
          { label: "Șabloane Email", path: "/admin/content/email-templates" },
          { label: "POS", path: "/admin/settings/pos", dividerBefore: "Module Avansate" },
          { label: "Dropshipping", path: "/admin/settings/dropshipping" },
          { label: "Multi-Store", path: "/admin/settings/multi-store" },
          { label: "Conturi Admin", path: "/admin/users", dividerBefore: "Administrare" },
          { label: "Roluri & Permisiuni", path: "/admin/users/roles" },
          { label: "Sesiuni Active", path: "/admin/users/sessions" },
          { label: "2FA", path: "/admin/users/2fa" },
          { label: "IP Whitelist", path: "/admin/users/ip-whitelist" },
          { label: "Jurnal Audit", path: "/admin/users/audit" },
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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isParentActive = (item: MenuItem) =>
    item.children?.some((c) => isActive(c.path)) ?? false;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "admin-sidebar h-screen flex flex-col shrink-0 transition-all duration-200 ease-in-out overflow-hidden bg-sidebar",
          "fixed lg:static z-50 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border shrink-0">
          <Link to="/admin" className="flex items-center gap-2 overflow-hidden" onClick={handleNavClick}>
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-sm text-sidebar-primary-foreground leading-tight">Mama Lucica</h2>
                <p className="text-[9px] text-sidebar-foreground/50 font-medium leading-none tracking-wider">ADMIN PANEL</p>
              </div>
            )}
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {section.title && !collapsed && (
                  <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
                    {section.title}
                  </p>
                )}
                {section.title && collapsed && (
                  <div className="hidden lg:block mx-2 my-3 border-t border-sidebar-border" />
                )}

                {section.items.map((item) => {
                  const hasChildren = !!item.children;
                  const isExpanded = expandedMenus.includes(item.label);
                  const parentActive = hasChildren && isParentActive(item);
                  const itemActive = !hasChildren && item.path && isActive(item.path);

                  // Collapsed: icon only with tooltip
                  if (collapsed) {
                    return (
                      <Tooltip key={item.label}>
                        <TooltipTrigger asChild>
                          {hasChildren ? (
                            <button
                              onClick={() => onToggleCollapse?.()}
                              className={cn(
                                "hidden lg:flex items-center justify-center w-full h-10 rounded-lg transition-all",
                                parentActive
                                  ? "bg-sidebar-accent text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                              )}
                            >
                              <item.icon className="w-[18px] h-[18px]" />
                            </button>
                          ) : (
                            <Link
                              to={item.path!}
                              onClick={handleNavClick}
                              className={cn(
                                "hidden lg:flex items-center justify-center w-full h-10 rounded-lg transition-all",
                                itemActive
                                  ? "bg-sidebar-accent text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                              )}
                            >
                              <item.icon className="w-[18px] h-[18px]" />
                            </Link>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  // Expanded: full menu
                  if (!hasChildren) {
                    return (
                      <Link
                        key={item.label}
                        to={item.path!}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-medium transition-all",
                          itemActive
                            ? "bg-sidebar-accent text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-3 h-9 rounded-lg text-[13px] font-medium transition-all",
                          parentActive
                            ? "text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-200",
                          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="ml-[18px] pl-4 border-l border-sidebar-border space-y-px mt-0.5 mb-1">
                          {item.children!.map((child) => (
                            <div key={child.path}>
                              {child.dividerBefore && (
                                <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/35">
                                  {child.dividerBefore}
                                </p>
                              )}
                              <Link
                                to={child.path}
                                onClick={handleNavClick}
                                className={cn(
                                  "block px-3 py-1.5 rounded-md text-[13px] transition-all",
                                  isActive(child.path)
                                    ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                                )}
                              >
                                {child.label}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 shrink-0 space-y-1">
          {!collapsed ? (
            <>
              {/* User info */}
              {user && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold shrink-0">
                    {(user.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sidebar-foreground text-xs font-medium truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Înapoi la magazin</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[13px] text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Deconectare</span>
              </button>
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[13px] text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
              >
                <PanelLeftClose className="w-4 h-4" />
                <span>Restrânge</span>
              </button>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/"
                    className="hidden lg:flex items-center justify-center w-full h-9 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Înapoi la magazin</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex items-center justify-center w-full h-9 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
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
