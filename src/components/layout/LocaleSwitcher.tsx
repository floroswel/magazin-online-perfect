import { useI18n } from "@/hooks/useI18n";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export default function LocaleSwitcher() {
  const { locale, setLocale, locales } = useI18n();
  const { currency, setCurrency, currencies } = useCurrency();

  const currentLocale = locales.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10 gap-1 text-xs px-2">
          <Globe className="h-3.5 w-3.5" />
          <span>{currentLocale?.flag} {currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Limbă</div>
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={locale === l.code ? "bg-primary/10 text-primary" : ""}
          >
            {l.flag} {l.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Monedă</div>
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={currency === c.code ? "bg-primary/10 text-primary" : ""}
          >
            {c.symbol} {c.code}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
