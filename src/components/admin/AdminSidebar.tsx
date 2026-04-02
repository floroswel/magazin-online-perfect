import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Megaphone, Trophy,
  FileText, BarChart3, TrendingUp, Palette, Plug, Settings, User,
  ChevronDown, X, ArrowLeft, PanelLeftClose, PanelLeftOpen, LogOut,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubItem { label: string; path: string }
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
          { label: "Procesare Comenzi", path: "/admin/orders/processing" },
          { label: "Coșuri Abandonate", path: "/admin/customers/abandoned" },
          { label: "Retururi", path: "/admin/orders/returns" },
        ],
      },
      {
        label: "Produse", icon: Package,
        children: [
          { label: "Toate Produsele", path: "/admin/products" },
          { label: "Categorii", path: "/admin/categories" },
          { label: "Mărci", path: "/admin/products/brands" },
          { label: "Atribute", path: "/admin/products/attributes" },
          { label: "Review-uri", path: "/admin/products/reviews" },
          { label: "Feed-uri", path: "/admin/marketing/feeds" },
          { label: "Stoc", path: "/admin/stock" },
          { label: "Furnizori", path: "/admin/stock/suppliers" },
        ],
      },
      {
        label: "CRM", icon: Users,
        children: [
          { label: "Clienți", path: "/admin/customers" },
          { label: "Grupuri Clienți", path: "/admin/customers/groups" },
          { label: "Segmente", path: "/admin/customers/segments" },
          { label: "Tichete Support", path: "/admin/customers/tickets" },
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
          { label: "Automatizări", path: "/admin/marketing/automations" },
          { label: "Bannere & Popups", path: "/admin/marketing/banners" },
        ],
      },
      {
        label: "Marketing", icon: Megaphone,
        children: [
          { label: "Cupoane", path: "/admin/coupons" },
          { label: "Promoții", path: "/admin/marketing/promotions" },
          { label: "Puncte Fidelitate", path: "/admin/customers/loyalty" },
          { label: "Liste Prețuri", path: "/admin/settings/price-lists" },
          { label: "Carduri Cadou", path: "/admin/marketing/gift-cards" },
          { label: "Afiliere", path: "/admin/marketing/affiliates" },
          { label: "Referral", path: "/admin/marketing/referrals" },
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
          { label: "Blog", path: "/admin/content/blog" },
          { label: "Pagini CMS", path: "/admin/content/pages" },
          { label: "Hero Slider", path: "/admin/content/hero-slides" },
          { label: "Meniuri", path: "/admin/content/menus" },
          { label: "Media Library", path: "/admin/content/media" },
          { label: "Șabloane Email", path: "/admin/content/email-templates" },
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
          { label: "Vânzări", path: "/admin/reports/profit" },
          { label: "Produse", path: "/admin/reports/top-products" },
          { label: "Clienți", path: "/admin/reports/customers" },
          { label: "Marketing", path: "/admin/reports/marketing" },
          { label: "Export", path: "/admin/reports/export" },
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
          { label: "Configurare Temă", path: "/admin/settings/theme" },
          { label: "Editor Conținut Site", path: "/admin/settings/content-editor" },
          { label: "Vizibilitate", path: "/admin/control" },
          { label: "Layout Secțiuni", path: "/admin/content/homepage" },
          { label: "Footer", path: "/admin/settings/footer" },
        ],
      },
      {
        label: "Integrări", icon: Plug,
        children: [
          { label: "Tracking & Pixeli", path: "/admin/marketing/pixels" },
          { label: "Curieri AWB", path: "/admin/shipping/carriers" },
          { label: "Facturare", path: "/admin/settings/smartbill" },
          { label: "Newsletter / Email", path: "/admin/settings/email" },
          { label: "Comparatoare", path: "/admin/marketing/feeds" },
        ],
      },
      {
        label: "Setări", icon: Settings,
        children: [
          { label: "Generale", path: "/admin/settings/general" },
          { label: "Plăți", path: "/admin/payments/methods" },
          { label: "Livrare", path: "/admin/shipping/rates" },
          { label: "Confidențialitate", path: "/admin/settings/gdpr" },
          { label: "SEO & Analytics", path: "/admin/settings/seo" },
          { label: "Securitate", path: "/admin/settings/security" },
          { label: "Conturi Admin", path: "/admin/users" },
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
          "min-h-screen flex flex-col shrink-0 transition-all duration-200 ease-in-out",
          "fixed lg:static z-50 lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16" : "w-60"
        )}
        style={{ background: "#1B2A4A" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 shrink-0">
          <Link to="/admin" className="flex items-center gap-2 overflow-hidden" onClick={handleNavClick}>
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-sm text-white leading-tight">Mama Lucica</h2>
                <p className="text-[9px] text-white/40 font-medium leading-none tracking-wider">ADMIN PANEL</p>
              </div>
            )}
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-white/10 text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-0.5">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {section.title && !collapsed && (
                  <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                    {section.title}
                  </p>
                )}
                {section.title && collapsed && (
                  <div className="hidden lg:block mx-2 my-3 border-t border-white/10" />
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
                                  ? "bg-white/10 text-white"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
                                  ? "bg-white/10 text-white"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:text-white/90 hover:bg-white/5"
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
                            ? "text-white"
                            : "text-white/60 hover:text-white/90 hover:bg-white/5"
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
                          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="ml-[18px] pl-4 border-l border-white/10 space-y-px mt-0.5 mb-1">
                          {item.children!.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={handleNavClick}
                              className={cn(
                                "block px-3 py-1.5 rounded-md text-[13px] transition-all",
                                isActive(child.path)
                                  ? "bg-white/10 text-white font-medium"
                                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
                              )}
                            >
                              {child.label}
                            </Link>
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
        <div className="border-t border-white/10 p-2 shrink-0 space-y-1">
          {!collapsed ? (
            <>
              {/* User info */}
              {user && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(user.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-medium truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Înapoi la magazin</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[13px] text-white/40 hover:text-red-400 hover:bg-white/5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Deconectare</span>
              </button>
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[13px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
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
                    className="hidden lg:flex items-center justify-center w-full h-9 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
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
                    className="hidden lg:flex items-center justify-center w-full h-9 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
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
