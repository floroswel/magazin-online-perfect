import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeNames: Record<string, string> = {
  catalog: "Catalog",
  product: "Produs",
  cart: "Coș",
  checkout: "Finalizare comandă",
  auth: "Autentificare",
  account: "Contul meu",
  favorites: "Favorite",
  compare: "Comparare",
  page: "Pagină",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  if (pathname === "/" || pathname.startsWith("/admin")) return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="container py-2" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <li>
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Acasă</span>
          </Link>
        </li>
        {segments.map((seg, i) => {
          const path = "/" + segments.slice(0, i + 1).join("/");
          const isLast = i === segments.length - 1;
          const label = routeNames[seg] || decodeURIComponent(seg);

          return (
            <li key={path} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">{label}</span>
              ) : (
                <Link to={path} className="hover:text-primary transition-colors">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
