type CandleCollectionLike = {
  name?: string | null;
  slug?: string | null;
};

const INCLUDE_KEYWORDS = [
  "luman",
  "seturi-cadou",
  "set-cadou",
  "set cadou",
  "personalizat",
  "parfumat",
  "decorativ",
];

const EXCLUDE_KEYWORDS = [
  "accesor",
  "gadget",
  "electronic",
  "telefon",
  "laptop",
  "fashion",
  "beauty",
  "cosmetic",
];

const normalize = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const isCandleCollection = (item: CandleCollectionLike) => {
  const slug = normalize(item.slug);
  const name = normalize(item.name);
  const source = `${slug} ${name}`;

  if (!source) return false;
  if (EXCLUDE_KEYWORDS.some((word) => source.includes(word))) return false;

  return INCLUDE_KEYWORDS.some((word) => source.includes(word));
};
