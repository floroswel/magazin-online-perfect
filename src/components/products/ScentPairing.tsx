import { Music, Coffee, Sun, Moon, Sunset } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Pairing {
  music?: { title: string; artist: string; url?: string };
  tea?: string;
  moment?: string;
  momentIcon?: "morning" | "afternoon" | "evening" | "night";
}

const DEFAULT_PAIRINGS: Record<string, Pairing> = {
  lavanda: {
    music: { title: "Clair de Lune", artist: "Debussy", url: "https://open.spotify.com/search/clair%20de%20lune" },
    tea: "Ceai de mușețel cu miere",
    moment: "Seara, după o zi lungă",
    momentIcon: "evening",
  },
  vanilie: {
    music: { title: "Weightless", artist: "Marconi Union", url: "https://open.spotify.com/search/weightless%20marconi%20union" },
    tea: "Chai latte cu scorțișoară",
    moment: "Duminică dimineața",
    momentIcon: "morning",
  },
  trandafir: {
    music: { title: "La Vie en Rose", artist: "Édith Piaf", url: "https://open.spotify.com/search/la%20vie%20en%20rose" },
    tea: "Ceai de trandafir cu petale",
    moment: "O seară romantică",
    momentIcon: "evening",
  },
  santal: {
    music: { title: "Sunset Lover", artist: "Petit Biscuit", url: "https://open.spotify.com/search/sunset%20lover" },
    tea: "Ceai matcha cu lapte de ovăz",
    moment: "Meditația de dimineață",
    momentIcon: "morning",
  },
  default: {
    music: { title: "Nuvole Bianche", artist: "Ludovico Einaudi", url: "https://open.spotify.com/search/nuvole%20bianche" },
    tea: "Ceai verde cu iasomie",
    moment: "Un moment de liniște",
    momentIcon: "afternoon",
  },
};

const momentIcons = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
  night: Moon,
};

interface Props {
  productName: string;
  tags?: string[];
}

export default function ScentPairing({ productName, tags }: Props) {
  // Find best matching pairing based on tags or product name
  const matchKey = Object.keys(DEFAULT_PAIRINGS).find(key =>
    key !== "default" && (
      tags?.some(t => t.toLowerCase().includes(key)) ||
      productName.toLowerCase().includes(key)
    )
  );
  const pairing = DEFAULT_PAIRINGS[matchKey || "default"];
  const MomentIcon = momentIcons[pairing.momentIcon || "afternoon"];

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">
          ✨ Această lumânare se potrivește cu...
        </h3>

        <div className="space-y-2.5">
          {/* Music */}
          {pairing.music && (
            <a
              href={pairing.music.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-[#1DB954]/10 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-[#1DB954]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Muzică recomandată</p>
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {pairing.music.title} — {pairing.music.artist}
                </p>
              </div>
            </a>
          )}

          {/* Tea */}
          {pairing.tea && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Băutură ideală</p>
                <p className="text-sm font-medium text-foreground">{pairing.tea}</p>
              </div>
            </div>
          )}

          {/* Moment */}
          {pairing.moment && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MomentIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Momentul perfect</p>
                <p className="text-sm font-medium text-foreground">{pairing.moment}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
