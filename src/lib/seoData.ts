// Centralized SEO programmatic data for city+category combinations

export const CITIES = [
  "bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta",
  "brasov", "craiova", "galati", "ploiesti", "oradea",
  "sibiu", "arad", "pitesti", "bacau", "targu-mures",
  "baia-mare", "buzau", "satu-mare", "botosani", "suceava",
] as const;

export const CITY_LABELS: Record<string, string> = {
  "bucuresti": "București", "cluj-napoca": "Cluj-Napoca", "timisoara": "Timișoara",
  "iasi": "Iași", "constanta": "Constanța", "brasov": "Brașov",
  "craiova": "Craiova", "galati": "Galați", "ploiesti": "Ploiești",
  "oradea": "Oradea", "sibiu": "Sibiu", "arad": "Arad",
  "pitesti": "Pitești", "bacau": "Bacău", "targu-mures": "Târgu Mureș",
  "baia-mare": "Baia Mare", "buzau": "Buzău", "satu-mare": "Satu Mare",
  "botosani": "Botoșani", "suceava": "Suceava",
};

export const SEO_CATEGORIES = [
  { slug: "lumanari-parfumate", label: "Lumânări parfumate", icon: "🕯️", keywords: ["parfumate", "aromate", "parfum"] },
  { slug: "lumanari-decorative", label: "Lumânări decorative", icon: "🎨", keywords: ["decorative", "decor", "design"] },
  { slug: "cadouri-lumanari", label: "Cadouri lumânări", icon: "🎁", keywords: ["cadou", "cadouri", "gift"] },
  { slug: "lumanari-soia", label: "Lumânări din ceară de soia", icon: "🌿", keywords: ["soia", "natural", "eco"] },
  { slug: "lumanari-artizanale", label: "Lumânări artizanale handmade", icon: "✋", keywords: ["artizanal", "handmade", "manual"] },
  { slug: "lumanari-masaj", label: "Lumânări de masaj", icon: "💆", keywords: ["masaj", "relaxare", "spa"] },
  { slug: "lumanari-botez", label: "Lumânări de botez", icon: "👶", keywords: ["botez", "ceremonie"] },
  { slug: "lumanari-nunta", label: "Lumânări de nuntă", icon: "💒", keywords: ["nunta", "mireasa"] },
  { slug: "lumanari-craciun", label: "Lumânări de Crăciun", icon: "🎄", keywords: ["craciun", "iarna", "sarbatori"] },
  { slug: "set-lumanari", label: "Seturi de lumânări cadou", icon: "📦", keywords: ["set", "seturi", "pachet"] },
  { slug: "lumanari-lavanda", label: "Lumânări cu lavandă", icon: "💜", keywords: ["lavanda", "lavandă"] },
  { slug: "lumanari-vanilie", label: "Lumânări cu vanilie", icon: "🍦", keywords: ["vanilie"] },
] as const;

export function getCityLabel(slug: string): string {
  return CITY_LABELS[slug] || slug.replace(/-/g, " ");
}

export function getCategoryLabel(slug: string): string {
  const found = SEO_CATEGORIES.find(c => c.slug === slug);
  return found?.label || slug.replace(/-/g, " ");
}

export function getCategoryIcon(slug: string): string {
  const found = SEO_CATEGORIES.find(c => c.slug === slug);
  return found?.icon || "🕯️";
}

// Generate FAQ content for a city+category combo
export function generateFAQ(cityLabel: string, catLabel: string): { q: string; a: string }[] {
  return [
    {
      q: `Unde pot cumpăra ${catLabel.toLowerCase()} în ${cityLabel}?`,
      a: `Pe MamaLucica.ro poți comanda ${catLabel.toLowerCase()} cu livrare rapidă în ${cityLabel}, de obicei în 1-3 zile lucrătoare. Toate lumânările sunt artizanale, din ingrediente naturale.`,
    },
    {
      q: `Cât costă livrarea în ${cityLabel}?`,
      a: `Livrarea în ${cityLabel} este gratuită pentru comenzi peste 150 RON. Sub această valoare, costul este de la 15 RON.`,
    },
    {
      q: `Lumânările sunt făcute din ingrediente naturale?`,
      a: `Da! Toate lumânările de pe MamaLucica sunt realizate din ceară de soia sau ceară naturală, cu fitiluri din bumbac și uleiuri esențiale sau parfumuri de calitate.`,
    },
    {
      q: `Pot returna o lumânare dacă nu sunt mulțumit?`,
      a: `Desigur. Ai 14 zile de retur gratuit conform politicii noastre de returnare.`,
    },
  ];
}
