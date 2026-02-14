import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Tag,
  Mail,
  BarChart3,
  ArrowLeft,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Produse", icon: Package, path: "/admin/products" },
  { label: "Categorii", icon: FolderTree, path: "/admin/categories" },
  { label: "Comenzi", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Cupoane", icon: Tag, path: "/admin/coupons" },
  { label: "Newsletter", icon: Mail, path: "/admin/newsletter" },
  { label: "Rapoarte", icon: BarChart3, path: "/admin/reports" },
];

export default function AdminSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r flex flex-col shrink-0">
      {/* Brand */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight">MegaShop</h2>
            <p className="text-[11px] text-muted-foreground">Panou Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.path)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi la magazin
        </Link>
      </div>
    </aside>
  );
}
